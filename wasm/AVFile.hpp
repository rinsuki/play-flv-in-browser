#include <iostream>
#include <vector>
#include <emscripten/val.h>
#include "libav.h"

class AVFile
{
    AVFormatContext *formatContext = nullptr;
    AVStream *videoStream = nullptr;
    AVCodec *codec;
    AVCodecContext *codecContext;
    AVFrame *frame = av_frame_alloc();
    AVPacket *packet;
    SwsContext *swsCtx;

    uint8_t *out = nullptr;

public:
    bool isFailed = false;

    inline AVFile(std::string filePath)
    {
        if (avformat_open_input(&formatContext, filePath.c_str(), nullptr, nullptr) != 0)
        {
            std::cerr << "avformat_open_input failed..." << std::endl;
            isFailed = true;
            return;
        }
        if (avformat_find_stream_info(formatContext, nullptr) < 0)
        {
            std::cerr << "avformat_find_stream_info failed..." << std::endl;
            isFailed = true;
            return;
        }
        av_dump_format(formatContext, 0, filePath.c_str(), false);

        for (int i = 0; i < formatContext->nb_streams; i++)
        {
            if (formatContext->streams[i]->codecpar->codec_type == AVMEDIA_TYPE_VIDEO)
            {
                videoStream = formatContext->streams[i];
                break;
            }
        }

        if (videoStream == nullptr)
        {
            std::cerr << "video stream not found" << std::endl;
            isFailed = true;
            return;
        }

        codec = avcodec_find_decoder(videoStream->codecpar->codec_id);
        if (codec == nullptr)
        {
            std::cerr << "failed to find decoder" << std::endl;
            isFailed = true;
            return;
        }

        codecContext = avcodec_alloc_context3(codec);
        if (codecContext == nullptr)
        {
            std::cerr << "failed to avcodec_alloc_context3" << std::endl;
            isFailed = true;
            return;
        }

        if (avcodec_parameters_to_context(codecContext, videoStream->codecpar) < 0)
        {
            std::cerr << "avcodec_parameters_to_context failed" << std::endl;
            isFailed = true;
            return;
        }

        if (avcodec_open2(codecContext, codec, nullptr) != 0)
        {
            std::cerr << "avcodec_open2 failed" << std::endl;
            isFailed = true;
            return;
        }

        packet = (AVPacket *)malloc(sizeof(AVPacket));
    }

    int inline readFrame()
    {
        return av_read_frame(formatContext, packet);
    }

    bool inline isVideoStream()
    {
        return packet->stream_index == videoStream->index;
    }

    void inline packetUnref()
    {
        av_packet_unref(packet);
        return;
    }

    // ---

    int inline sendPacket()
    {
        return avcodec_send_packet(codecContext, packet);
    }

    int inline receiveFrame()
    {
        return avcodec_receive_frame(codecContext, frame);
    }

    bool inline getIsFailed() const
    {
        return this->isFailed;
    }

    // ---

    int inline width()
    {
        return frame->width;
    }

    int inline height()
    {
        return frame->height;
    }

    emscripten::val inline convertFrameToRGB()
    {
        swsCtx = sws_getCachedContext(
            swsCtx,
            /* src */ frame->width, frame->height, (AVPixelFormat)frame->format,
            /* dst */ frame->width, frame->height, AV_PIX_FMT_RGBA,
            SWS_BILINEAR, NULL, NULL, NULL);
        const unsigned int size = 4 * frame->width * frame->height;
        if (out == nullptr)
            out = (uint8_t *)calloc(size, sizeof(uint8_t));
        uint8_t *argb[1] = {out};
        int argb_stride[1] = {4 * frame->width};
        sws_scale(swsCtx, frame->data, frame->linesize, 0, codecContext->height, argb, argb_stride);
        return emscripten::val(emscripten::typed_memory_view(size, out));
    }

    void getPixFmt()
    {
        const AVPixFmtDescriptor *desc = av_pix_fmt_desc_get((AVPixelFormat)(frame->format));
        std::cout << desc->name << std::endl;
    }
};
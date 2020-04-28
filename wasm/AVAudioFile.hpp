#include <iostream>
#include "libav.h"

class AVAudioFile
{
    AVFormatContext *inputFormatContext = nullptr;
    AVStream *inputAudioStream = nullptr;
    AVCodec *inputCodec;

public:
    bool isFailed = false;
    std::string ext;

    inline AVAudioFile(std::string inFilePath)
    {
        if (avformat_open_input(&inputFormatContext, inFilePath.c_str(), nullptr, nullptr) != 0)
        {
            std::cerr << "avformat_open_input failed.." << std::endl;
            isFailed = true;
            return;
        }
        if (avformat_find_stream_info(inputFormatContext, nullptr) < 0)
        {
            std::cerr << "avformat_find_stream_info failed..." << std::endl;
            isFailed = true;
            return;
        }
        av_dump_format(inputFormatContext, 0, inFilePath.c_str(), false);

        for (int i = 0; i < inputFormatContext->nb_streams; i++)
        {
            if (inputFormatContext->streams[i]->codecpar->codec_type == AVMEDIA_TYPE_AUDIO)
            {
                inputAudioStream = inputFormatContext->streams[i];
                break;
            }
        }

        if (inputAudioStream == nullptr)
        {
            std::cerr << "audio stream not found" << std::endl;
            isFailed = true;
            return;
        }

        switch (inputAudioStream->codecpar->codec_id)
        {
        case AV_CODEC_ID_MP3:
            ext = "mp3";
            break;
        case AV_CODEC_ID_AAC:
            ext = "mp4";
            break;
        default:
            std::cerr << "unknown audio stream: " << inputAudioStream->codecpar->codec_id << std::endl;
            isFailed = true;
            return;
        }

        inputCodec = avcodec_find_decoder(inputAudioStream->codecpar->codec_id);
        if (inputCodec == nullptr)
        {
            std::cerr << "avcodec_find_decoder failed..." << std::endl;
            isFailed = true;
            return;
        }
    }

    void inline output()
    {
        std::string outPath = path();
        AVIOContext *ioContext = nullptr;
        if (avio_open(&ioContext, outPath.c_str(), AVIO_FLAG_WRITE) < 0)
        {
            std::cerr << "avio_open failed..." << std::endl;
            isFailed = true;
            return;
        }

        AVFormatContext *outputFormatContext = nullptr;
        if (avformat_alloc_output_context2(&outputFormatContext, nullptr, ext.c_str(), nullptr) < 0)
        {
            std::cerr << "avformat_alloc_output_context2 failed..." << std::endl;
            isFailed = true;
            return;
        }
        outputFormatContext->pb = ioContext;

        AVStream *outStream = avformat_new_stream(outputFormatContext, inputCodec);
        if (outStream == nullptr)
        {
            std::cerr << "avformat_new_stream failed..." << std::endl;
            isFailed = true;
            return;
        }

        outStream->sample_aspect_ratio = inputAudioStream->sample_aspect_ratio;
        outStream->time_base = inputAudioStream->time_base;
        if (avcodec_parameters_copy(outStream->codecpar, inputAudioStream->codecpar) < 0)
        {
            std::cerr << "avcodec_parameters_copy failed..." << std::endl;
            isFailed = true;
            return;
        }

        outStream->codecpar->codec_tag = 0;

        std::cout << "lets write header" << std::endl;
        if (avformat_write_header(outputFormatContext, nullptr) < 0)
        {
            std::cerr << "avformat_write_header failed..." << std::endl;
            isFailed = true;
            return;
        }
        std::cout << "writed" << std::endl;

        AVPacket packet = AVPacket();
        std::cout << "extract audio start" << std::endl;
        while (av_read_frame(inputFormatContext, &packet) == 0)
        {
            if (packet.stream_index == inputAudioStream->index)
            {
                AVRational inTimeBase = inputAudioStream->time_base;
                AVRational outTimeBase = outStream->time_base;
                packet.stream_index = outStream->index;
                av_packet_rescale_ts(&packet, inTimeBase, outTimeBase);
                if (av_interleaved_write_frame(outputFormatContext, &packet) != 0)
                {
                    std::cerr << "av_interleaved_write_frame failed..." << std::endl;
                    isFailed = true;
                    return;
                }
            }
            else
            {
                av_packet_unref(&packet);
            }
        }
        std::cout << "extract audio end" << std::endl;

        if (av_write_trailer(outputFormatContext) != 0)
        {
            std::cerr << "av_write_trailer failed..." << std::endl;
            isFailed = true;
            return;
        }

        avformat_close_input(&inputFormatContext);
        avformat_free_context(outputFormatContext);
        avio_close(ioContext);
    }

    std::string inline path()
    {
        return "/out." + ext;
    }

    bool inline getIsFailed() const
    {
        return this->isFailed;
    }
};
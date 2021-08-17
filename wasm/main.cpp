#include <iostream>
#include <emscripten/bind.h>

#include "libav.h"
#include "AVAudioFile.hpp"
#include "AVVideoFile.hpp"

EMSCRIPTEN_BINDINGS(my_module)
{
    emscripten::value_array<AVRational>("AVRational")
        .element(&AVRational::num)
        .element(&AVRational::den);
    emscripten::class_<AVAudioFile>("AVAudioFile")
        .constructor<std::string>()
        .function("output", &AVAudioFile::output)
        .function("path", &AVAudioFile::path)
        .property("isFailed", &AVAudioFile::getIsFailed);
    emscripten::class_<AVVideoFile>("AVVideoFile")
        .constructor<std::string>()
        .function("readFrame", &AVVideoFile::readFrame)
        .function("isVideoStream", &AVVideoFile::isVideoStream)
        .function("packetUnref", &AVVideoFile::packetUnref)
        .function("sendPacket", &AVVideoFile::sendPacket)
        .function("receiveFrame", &AVVideoFile::receiveFrame)
        .function("width", &AVVideoFile::width)
        .function("height", &AVVideoFile::height)
        .function("getPixFmt", &AVVideoFile::getPixFmt)
        .function("convertFrameToRGB", &AVVideoFile::convertFrameToRGB)
        .function("outputArray", &AVVideoFile::outputArray)
        .function("pts", &AVVideoFile::pts)
        .function("timeBase", &AVVideoFile::timeBase)
        .function("seekToFirst", &AVVideoFile::seekToFirst)
        .property("isFailed", &AVVideoFile::getIsFailed);
    emscripten::register_vector<uint8_t>("vector<uint8_t>");
}

int main(int argc, const char **argv)
{
    av_register_all();
    //     AVFormatContext *formatContext = nullptr;
    //     if (avformat_open_input(&formatContext, "/input.flv", nullptr, nullptr) != 0)
    //     {
    //         std::cerr << "avformat_open_input failed..." << std::endl;
    //         return 1;
    //     }
    //     if (avformat_find_stream_info(formatContext, nullptr) < 0)
    //     {
    //         std::cerr << "avformat_find_stream_info failed..." << std::endl;
    //         return 2;
    //     }
    //     av_dump_format(formatContext, 0, "/input.flv", false);

    //     // find video stream

    //     AVStream *videoStream = nullptr;
    //     for (int i = 0; i < formatContext->nb_streams; i++)
    //     {
    //         if (formatContext->streams[i]->codecpar->codec_type == AVMEDIA_TYPE_VIDEO)
    //         {
    //             videoStream = formatContext->streams[i];
    //             break;
    //         }
    //     }
    //     if (videoStream == nullptr)
    //     {
    //         std::cerr << "failed to find video stream" << std::endl;
    //         return 3;
    //     }

    //     // setup decoder

    //     AVCodec *codec = avcodec_find_decoder(videoStream->codecpar->codec_id);
    //     if (codec == nullptr)
    //     {
    //         std::cerr << "failed to find decoder" << std::endl;
    //         return 4;
    //     }

    //     AVCodecContext *codecContext = avcodec_alloc_context3(codec);
    //     if (codecContext == nullptr)
    //     {
    //         std::cerr << "avcodec_alloc_context3 failed" << std::endl;
    //         return 5;
    //     }

    //     if (avcodec_parameters_to_context(codecContext, videoStream->codecpar) < 0)
    //     {
    //         std::cerr << "avcodec_parameters_to_context failed" << std::endl;
    //         return 6;
    //     }

    //     if (avcodec_open2(codecContext, codec, nullptr) != 0)
    //     {
    //         std::cerr << "avcodec_open2 failed" << std::endl;
    //     }

    //     return 0;

    //     // lets decode!

    //     AVFrame *frame = av_frame_alloc();
    //     AVPacket packet = AVPacket();
    //     while (av_read_frame(formatContext, &packet) == 0)
    //     {
    //         if (packet.stream_index == videoStream->index)
    //         {
    //             if (avcodec_send_packet(codecContext, &packet) != 0)
    //             {
    //                 std::cerr << "avcodec_send_packet failed" << std::endl;
    //             }
    //             while (avcodec_receive_frame(codecContext, frame) == 0)
    //             {
    //                 std::cout << "decoding" << frame->pts << std::endl;
    //             }
    //         }
    //         av_packet_unref(&packet);
    //     }

    //     std::cout << "good bye!" << std::endl;

    return 0;
}
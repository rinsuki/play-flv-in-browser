#include <iostream>

extern "C"
{
#include <libavutil/imgutils.h>
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
}

int main(int argc, const char **argv)
{
    av_register_all();
    AVFormatContext *formatContext = nullptr;
    if (avformat_open_input(&formatContext, "/input.flv", nullptr, nullptr) != 0)
    {
        std::cerr << "avformat_open_input failed..." << std::endl;
        return 1;
    }
    if (avformat_find_stream_info(formatContext, nullptr) < 0)
    {
        std::cerr << "avformat_find_stream_info failed..." << std::endl;
        return 2;
    }
    av_dump_format(formatContext, 0, "/input.flv", false);
    return 0;
}
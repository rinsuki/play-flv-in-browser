#include <iostream>
#include "libav.h"

class AVFile
{
    AVFormatContext *formatContext = nullptr;

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
    }
};
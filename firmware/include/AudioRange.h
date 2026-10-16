#pragma once
#include <cstddef>
#include <cstdint>
#include <cstring>
namespace pq {
struct AudioRange {int status;size_t first,last;};
// Single byte ranges, including suffix/open-ended. Reject malformed/multipart.
inline AudioRange audioRange(const char *header,size_t size) {
    AudioRange bad{416,0,0};if(!size)return bad;
    if(!header||!*header)return {200,0,size-1};
    if(std::strncmp(header,"bytes=",6)!=0)return bad;
    const char *p=header+6;
    auto number=[&p](size_t &value){value=0;bool any=false;while(*p>='0'&&*p<='9'){const unsigned n=*p++-'0';if(value>(SIZE_MAX-n)/10)return false;value=value*10+n;any=true;}return any;};
    size_t first=0,last=0;
    if(*p=='-'){++p;if(!number(last)||*p||!last)return bad;return {206,last>=size?0:size-last,size-1};}
    if(!number(first)||*p++!='-'||first>=size)return bad;
    if(!*p)return {206,first,size-1};
    if(!number(last)||*p||last<first)return bad;
    return {206,first,last>=size?size-1:last};
}
}

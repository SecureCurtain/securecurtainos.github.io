#pragma once
#include <stddef.h>
#include <stdint.h>

#define KERN_EMERG   "<0>"
#define KERN_ALERT   "<1>"
#define KERN_CRIT    "<2>"
#define KERN_ERR     "<3>"
#define KERN_WARNING "<4>"
#define KERN_NOTICE  "<5>"
#define KERN_INFO    "<6>"
#define KERN_DEBUG   "<7>"

#define container_of(ptr, type, member) ({                      \\
        const typeof( ((type *)0)->member ) *__mptr = (ptr);    \\
        (type *)( (char *)__mptr - offsetof(type,member) );})
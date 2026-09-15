#pragma once

typedef unsigned long long size_t;
typedef long long          ptrdiff_t;

#ifndef NULL
#define NULL ((void*)0)
#endif

#ifndef offsetof
#define offsetof(type, member) __builtin_offsetof(type, member)
#endif

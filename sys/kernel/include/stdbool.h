#pragma once

#ifndef __cplusplus
#if !defined(__bool_true_false_are_defined)
#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 202311L
// In C23, bool, true, and false are predefined language keywords
#else
#define bool _Bool
#define true  1
#define false 0
#endif
#define __bool_true_false_are_defined 1
#endif
#endif

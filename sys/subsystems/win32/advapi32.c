#include <stdint.h>

#define ERROR_SUCCESS 0

int __attribute__((stdcall)) RegOpenKeyExW(void* hKey, const uint16_t* lpSubKey, uint32_t ulOptions, uint32_t samDesired, void** phkResult) {
    (void)hKey;
    (void)lpSubKey;
    (void)ulOptions;
    (void)samDesired;
    *phkResult = (void*)0x2222; // Pass a placeholder registry handle back
    return ERROR_SUCCESS;
}

int __attribute__((stdcall)) RegQueryValueExW(void* hKey, const uint16_t* lpValueName, uint32_t* lpReserved, uint32_t* lpType, uint8_t* lpData, uint32_t* lpcbData) {
    (void)hKey;
    (void)lpValueName;
    (void)lpReserved;
    (void)lpType;
    (void)lpData;
    (void)lpcbData;
    return ERROR_SUCCESS;
}

int __attribute__((stdcall)) GetUserNameW(uint16_t* lpBuffer, uint32_t* pcbBuffer) {
    // Fake the user profile response name securely
    lpBuffer[0] = 'U'; lpBuffer[1] = 's'; lpBuffer[2] = 'e'; lpBuffer[3] = 'r'; lpBuffer[4] = 0;
    *pcbBuffer = 5;
    return 1;
}

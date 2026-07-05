# Hikvision DS-K1T341CMFW Integration Notes

## What we verified

- Device model: `DS-K1T341CMFW`
- Firmware: `V3.3.15 build 240702`
- `ISAPI` responds on `https://192.168.100.96/ISAPI`
- Digest authentication is required for protected endpoints
- Hik-Connect / EZVIZ binding is active
- The device reports QR support through capabilities:
  - `isSupportQRCodeInfo=true`
  - `isSupportQRCodeEncryption=true`

## Step 1: Enable QR authentication

The device and Hikvision documentation both indicate that QR authentication exists, but it is not guaranteed to be enabled by default.

Recommended UI path:

1. Open `https://192.168.100.96`
2. Log in with admin credentials
3. Go to `Access Control`
4. Open `Advanced Function`
5. Enter `More Parameters`
6. Select the face recognition terminal
7. Enable `Authenticate by QR Code`
8. Save the changes

If the menu item is not visible on the device web UI, the same setting usually needs to be activated from HikCentral Professional / HikCentral AC.

## What can be automated

- Confirm device reachability
- Read device info and capabilities
- Confirm Hik-Connect binding status
- Register the device in ZIII
- Store a generated visitor pass and share link

## What still needs confirmation

- The exact Hikvision endpoint for native visitor QR issuance on this firmware
- Whether the current installation uses standalone device enrollment or HikCentral as the credential source
- The exact event collection endpoint for visitor entry logs on this terminal profile

## Recommended ZIII flow

1. Resident creates visit in ZIII
2. ZIII enrolls the person in Hikvision or HikCentral
3. Hikvision returns the native QR credential or a QR reference
4. ZIII stores `accessControlPassId` and `qrCode`
5. Resident downloads, shares, or sends the QR to the visitor

# Hikvision Team Mode Flow for ZIII

## Goal

Generate a native Hikvision visitor QR and let ZIII distribute it to the resident for sharing.

## Official requirements confirmed

- Hikvision states that visitor QR opening belongs to `Hik-Connect Team` / platform integration, not just local device setup.
- Their partner integration page states you must:
- Register at `tpp.hikvision.com`
- Create a `Hik-Connect Team Mode` account
- Apply for `AK/SK`
- Have the relevant Team/General license
- Then use OpenAPI for third-party system integration

Source:
- https://tpp.hikvision.com/products/HC-Integration
- https://www.hikvision.com/en/products/software/hik-connect/team-mode/

## What ZIII should send

- `propertyId`
- `unitId`
- `visitorName`
- `visitorPhone`
- `visitorEmail`
- `purpose`
- `validFrom`
- `validUntil`
- `createdBy`
- `accessControlProviderId = hikvision`
- `allowedDoors` when the property needs door scoping
- `maxEntries` when the visit must be limited
- `metadata` for internal traceability

## What Hikvision should return

- `accessControlPassId`
- `qrCode` or QR reference
- `pinCode` only if a fallback credential exists
- status/approval information

## End-to-end flow

1. Resident creates visit in ZIII
2. ZIII sends the invitation to Hikvision or HikCentral
3. Hikvision creates the visitor credential
4. ZIII stores the returned QR and pass ID
5. ZIII gives the resident a shareable QR view and download path
6. Resident shares it by WhatsApp, email, or any channel they want

## Current note on the device

The DS-K1T341CMFW local web UI does not expose QR in the authentication dropdown seen on the terminal screenshot.
That strongly suggests the QR path is managed by the platform layer, not by that local menu alone.

## Current backend status

ZIII is now prepared for two Hikvision modes:

- `device`: validates the local terminal and can keep working with a bridge QR while OpenAPI is pending
- `team`: expects Hik-Connect Team / HikCentral OpenAPI data so ZIII can switch to native visitor QR issuance

## Latest validated flow on July 2, 2026

- `POST /api/hccgw/platform/v1/token/get` works with the tenant App Key and App Secret
- `POST /api/hccgw/vims/v1/tempauth/add` creates a real temporary pass and returns:
  - a real pass ID
  - a native QR image in base64 PNG
  - a fallback PIN/password
- ZIII already stores that response and exposes:
  - mobile share view
  - email preview
  - print / PDF view
- The remaining blocker is not QR generation anymore
- The blocker is authorization binding

## Confirmed blocker in this tenant

- The tenant currently returns `0` access levels from `POST /api/hccgw/acspm/v1/accesslevel/list`
- `vims` also returns no buildings and no rooms in this tenant
- A pass created without `alIds` is created successfully but may remain unusable at the reader
- In Hik-Connect Teams, pressing `Conceder...` on that pass makes it usable
- That means the pass exists, but the access concession is being attached later in Teams

## What ZIII now requires to create a usable QR automatically

- At least one valid Hikvision access level ID in `alIds`
- ZIII can send that value in either of these ways:
  - `HIKVISION_DEFAULT_ACCESS_GROUP_ID` in backend environment
  - `metadata.accessLevelIds` from the ZIII form or API

If no `alIds` are configured, ZIII now fails fast with a clear error instead of creating a QR that still depends on
manual `Conceder...`.

## What is still required from Hikvision

- A valid access concession / access level configured in the tenant for the target door(s)
- The corresponding `alId` so ZIII can send it on `tempauth/add`
- Or the undocumented `Conceder...` endpoint if Hikvision handles this outside the public OpenAPI

Without one of those two, ZIII can generate the QR but cannot make it fully autonomous for door opening.

## Recommended next step in operations

1. Create or identify the correct access concession in Hik-Connect Teams for the visit door.
2. Capture its `alId`.
3. Put that `alId` into `HIKVISION_DEFAULT_ACCESS_GROUP_ID` or send it per visit from ZIII.
4. Generate a new pass from ZIII and validate it at the reader without pressing `Conceder...`.

## Historical note

- `openApiBaseUrl=https://ius-team.hikcentralconnect.com`
- `visitorQrEndpoint=/hcc/hccvims/v2/tempAuth/getInfo`
- Captured payload shape:
  - `id`
  - `clientLocalTime`
- Direct calls to that endpoint returned `VMS002004: You need login first`

That older path was useful for reverse engineering, but the working public OpenAPI flow is now the `token/get` plus
`vims/v1/tempauth/*` sequence.

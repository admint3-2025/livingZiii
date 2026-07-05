"use strict";
/**
 * ACCESS CONTROL PROVIDER CONTRACTS
 *
 * Define a pluggable access control provider system that allows integration
 * with multiple hardware/software providers (Hikvision, Dahua, ZKTeco, Suprema, HID, etc.)
 *
 * This is the NORTH STRATEGIC module: integrating physical access control
 * with ZIII's visitor management and audit system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessEventType = void 0;
var AccessEventType;
(function (AccessEventType) {
    AccessEventType["ENTRY"] = "entry";
    AccessEventType["EXIT"] = "exit";
    AccessEventType["ENTRY_DENIED"] = "entry_denied";
    AccessEventType["EXIT_DENIED"] = "exit_denied";
    AccessEventType["ALARM"] = "alarm";
    AccessEventType["MANUAL_OPEN"] = "manual_open";
})(AccessEventType || (exports.AccessEventType = AccessEventType = {}));
//# sourceMappingURL=access-control.provider.js.map
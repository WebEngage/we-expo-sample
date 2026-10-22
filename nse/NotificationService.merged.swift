import UserNotifications
import WEServiceExtension

// Merged service extension: WebEngage payloads go to WebEngage, everything else to the app's own handling.
// (Same shape as the example in webengage-expo-push's README.)
class NotificationService: UNNotificationServiceExtension {
    let wegService = WEXPushNotificationService()

    override func didReceive(_ request: UNNotificationRequest,
                             withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        if let payload = request.content.userInfo as? [String: Any],
           payload["source"] as? String == "webengage" {
            wegService.didReceive(request, withContentHandler: contentHandler)
            return
        }
        // The other provider's handling (demo stand-in).
        if let content = request.content.mutableCopy() as? UNMutableNotificationContent {
            content.body = "[demo-nse] " + content.body
            contentHandler(content)
        } else {
            contentHandler(request.content)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        wegService.serviceExtensionTimeWillExpire()
    }
}

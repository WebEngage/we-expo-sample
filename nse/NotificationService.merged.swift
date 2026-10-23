import UserNotifications
// WebEngage's service extension library (added to this target by webengage-expo-push)
import WEServiceExtension

// Shared service extension (iOS allows only one): WebEngage pushes go to WebEngage
// (Rich Push), everything else keeps the app's own handling, unchanged.
class NotificationService: UNNotificationServiceExtension {
    let wegService = WEXPushNotificationService()
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttempt: UNMutableNotificationContent?
    var isWebEngagePush = false

    override func didReceive(_ request: UNNotificationRequest,
                             withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        // WebEngage push
        if let payload = request.content.userInfo as? [String: Any],
           payload["source"] as? String == "webengage" {
            isWebEngagePush = true
            wegService.didReceive(request, withContentHandler: contentHandler)
            return
        }

        // The app's own handling: marks the body so a delivered push shows it ran.
        self.contentHandler = contentHandler
        bestAttempt = (request.content.mutableCopy() as? UNMutableNotificationContent)
        if let content = bestAttempt {
            content.body = "[demo-nse] " + content.body
            contentHandler(content)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        if isWebEngagePush {
            wegService.serviceExtensionTimeWillExpire()
        } else if let handler = contentHandler, let content = bestAttempt {
            handler(content)
        }
    }
}

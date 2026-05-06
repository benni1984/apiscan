import Foundation
import Security

final class KeychainService {
    static let shared = KeychainService()
    private init() {}

    private let service = "com.apiscan.app"

    var accessToken: String? {
        get { read(key: "access_token") }
        set {
            if let v = newValue { save(v, key: "access_token") } else { _ = delete(key: "access_token") }
        }
    }

    var refreshToken: String? {
        get { read(key: "refresh_token") }
        set {
            if let v = newValue { save(v, key: "refresh_token") } else { _ = delete(key: "refresh_token") }
        }
    }

    func clearAll() {
        delete(key: "access_token")
        delete(key: "refresh_token")
    }

    private func save(_ value: String, key: String) {
        let data = Data(value.utf8)
        var query = baseQuery(key: key)
        SecItemDelete(query as CFDictionary)
        query[kSecValueData as String] = data
        SecItemAdd(query as CFDictionary, nil)
    }

    private func read(key: String) -> String? {
        var query = baseQuery(key: key)
        query[kSecReturnData as String]  = true
        query[kSecMatchLimit as String]  = kSecMatchLimitOne
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    @discardableResult
    private func delete(key: String) -> Bool {
        let query = baseQuery(key: key)
        return SecItemDelete(query as CFDictionary) == errSecSuccess
    }

    private func baseQuery(key: String) -> [String: Any] {
        [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }
}

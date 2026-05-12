import XCTest

final class SettingsUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockAuthenticated"]
        app.launch()
        navigateToSettings()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_settings_showsUserEmail() {
        XCTAssertTrue(app.staticTexts["tester@example.com"].waitForExistence(timeout: 5))
    }

    func test_settings_showsLanguageOptions() {
        XCTAssertTrue(app.staticTexts["English"].waitForExistence(timeout: 5))
    }

    func test_settings_showsSaveProfileButton() {
        XCTAssertTrue(app.buttons["Save Profile"].waitForExistence(timeout: 5))
    }

    func test_settings_showsLogoutButton() {
        XCTAssertTrue(app.buttons["Log Out"].waitForExistence(timeout: 5))
    }

    // MARK: - Helper

    private func navigateToSettings() {
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
    }
}

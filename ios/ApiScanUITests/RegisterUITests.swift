import XCTest

final class RegisterUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain"]
        app.launch()
        navigateToRegister()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    // MARK: - Structure

    func test_registerScreen_showsNameEmailPasswordFields() {
        XCTAssertTrue(app.textFields["Name"].exists)
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)
    }

    func test_registerScreen_createAccountButtonDisabledWhenFieldsEmpty() {
        XCTAssertFalse(app.buttons["Create Account"].isEnabled)
    }

    func test_registerScreen_buttonDisabledWithShortPassword() {
        app.textFields["Name"].tap()
        app.textFields["Name"].typeText("Alice")
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("alice@example.com")
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("short")
        XCTAssertFalse(app.buttons["Create Account"].isEnabled)
    }

    func test_registerScreen_buttonEnabledWhenAllFieldsValid() {
        fillForm(name: "Alice", email: "alice@example.com", password: "Password123")
        XCTAssertTrue(app.buttons["Create Account"].isEnabled)
    }

    // MARK: - Success path (requires mock server)

    func test_registerScreen_successNavigatesToApiaryList() {
        app.terminate()
        app.launchArguments = ["-resetKeychain", "-mockServer"]
        app.launch()
        navigateToRegister()
        fillForm(name: "Alice", email: "alice@example.com", password: "Password123")
        app.buttons["Create Account"].tap()
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
    }

    // MARK: - Helpers

    private func navigateToRegister() {
        XCTAssertTrue(app.buttons["Create an account"].waitForExistence(timeout: 5))
        app.buttons["Create an account"].tap()
        XCTAssertTrue(app.textFields["Name"].waitForExistence(timeout: 5))
    }

    private func fillForm(name: String, email: String, password: String) {
        app.textFields["Name"].tap()
        app.textFields["Name"].typeText(name)
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText(email)
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText(password)
    }
}

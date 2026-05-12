import XCTest

final class ApiaryListUITests: XCTestCase {

    private var app: XCUIApplication!

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    // MARK: - Empty state

    func test_apiaryList_showsNavigationTitle() {
        launch(with: "-mockAuthenticated")
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
    }

    func test_apiaryList_showsEmptyStateWhenNoApiaries() {
        launch(with: "-mockAuthenticated")
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["No Apiaries"].waitForExistence(timeout: 5))
    }

    func test_apiaryList_hasPlusButtonInToolbar() {
        launch(with: "-mockAuthenticated")
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.navigationBars.buttons["Add"].exists)
    }

    // MARK: - With data

    func test_apiaryList_showsApiaryNameWhenDataLoaded() {
        launch(with: "-mockApiaryWithHive")
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
    }

    func test_apiaryList_canNavigateToApiary() {
        launch(with: "-mockApiaryWithHive")
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.navigationBars["Meadow"].waitForExistence(timeout: 5))
    }

    // MARK: - Helper

    private func launch(with arg: String) {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", arg]
        app.launch()
    }
}

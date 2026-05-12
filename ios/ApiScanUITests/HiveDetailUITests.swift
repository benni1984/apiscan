import XCTest

final class HiveDetailUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive"]
        app.launch()
        navigateToHiveDetail()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_hiveDetail_showsHiveNameInNavBar() {
        XCTAssertTrue(app.navigationBars["Hive Alpha"].exists)
    }

    func test_hiveDetail_showsHiveType() {
        XCTAssertTrue(app.staticTexts["Langstroth"].exists)
    }

    func test_hiveDetail_showsEmptyInspectionsMessage() {
        XCTAssertTrue(app.staticTexts["No inspections yet."].waitForExistence(timeout: 5))
    }

    func test_hiveDetail_newInspectionButtonOpenForm() {
        app.buttons["New Inspection"].tap()
        XCTAssertTrue(app.navigationBars["New Inspection"].waitForExistence(timeout: 5))
    }

    // MARK: - Helper

    private func navigateToHiveDetail() {
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 5))
        app.staticTexts["Hive Alpha"].tap()
        XCTAssertTrue(app.navigationBars["Hive Alpha"].waitForExistence(timeout: 5))
    }
}

import XCTest

final class InspectionFormUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive"]
        app.launch()
        navigateToInspectionForm()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_inspectionForm_showsNavigationTitle() {
        XCTAssertTrue(app.navigationBars["New Inspection"].exists)
    }

    func test_inspectionForm_showsDateSection() {
        XCTAssertTrue(app.staticTexts["Date"].exists)
    }

    func test_inspectionForm_showsQueenSection() {
        XCTAssertTrue(app.staticTexts["Queen"].exists)
    }

    func test_inspectionForm_showsFramesSection() {
        XCTAssertTrue(app.staticTexts["Frames"].exists)
    }

    func test_inspectionForm_hasSaveButton() {
        XCTAssertTrue(app.buttons["Save"].exists)
    }

    func test_inspectionForm_hasCancelButton() {
        XCTAssertTrue(app.buttons["Cancel"].exists)
    }

    func test_inspectionForm_cancelDismissesSheet() {
        app.buttons["Cancel"].tap()
        XCTAssertTrue(app.navigationBars["Hive Alpha"].waitForExistence(timeout: 5))
    }

    // MARK: - Helper

    private func navigateToInspectionForm() {
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 5))
        app.staticTexts["Hive Alpha"].tap()
        XCTAssertTrue(app.buttons["New Inspection"].waitForExistence(timeout: 5))
        app.buttons["New Inspection"].tap()
        XCTAssertTrue(app.navigationBars["New Inspection"].waitForExistence(timeout: 5))
    }
}

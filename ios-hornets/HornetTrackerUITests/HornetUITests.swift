import XCTest

final class HornetUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    // MARK: - Root navigation

    func test_rootView_showsHornetTrackerTitle() {
        XCTAssertTrue(app.navigationBars["Hornet Tracker"].waitForExistence(timeout: 5))
    }

    // MARK: - Sub-tabs

    func test_hornetView_showsSegmentedTabs() {
        XCTAssertTrue(app.segmentedControls.firstMatch.waitForExistence(timeout: 5))
        let picker = app.segmentedControls.firstMatch
        XCTAssertTrue(picker.buttons["Info"].exists)
        XCTAssertTrue(picker.buttons["Map"].exists)
        XCTAssertTrue(picker.buttons["Report"].exists)
        XCTAssertTrue(picker.buttons["Community"].exists)
    }

    // MARK: - Info tab

    func test_infoTab_isDefaultSelection() {
        XCTAssertTrue(app.segmentedControls.firstMatch.waitForExistence(timeout: 5))
        // Info tab is selected by default — info content should be visible
        XCTAssertTrue(app.staticTexts["The Asian Hornet"].waitForExistence(timeout: 5))
    }

    // MARK: - Report tab

    func test_reportTab_showsCatchAndNestPicker() {
        app.segmentedControls.firstMatch.waitForExistence(timeout: 5)
        app.segmentedControls.firstMatch.buttons["Report"].tap()

        // Inner picker for Catch / Nest
        let innerPicker = app.segmentedControls.element(boundBy: 1)
        XCTAssertTrue(innerPicker.waitForExistence(timeout: 5))
        XCTAssertTrue(innerPicker.buttons["Catch"].exists)
        XCTAssertTrue(innerPicker.buttons["Nest"].exists)
    }

    func test_reportTab_submitButtonExists() {
        app.segmentedControls.firstMatch.waitForExistence(timeout: 5)
        app.segmentedControls.firstMatch.buttons["Report"].tap()
        XCTAssertTrue(app.buttons["Submit Report"].waitForExistence(timeout: 5))
    }

    // MARK: - Community tab

    func test_communityTab_canBeNavigatedTo() {
        app.segmentedControls.firstMatch.waitForExistence(timeout: 5)
        app.segmentedControls.firstMatch.buttons["Community"].tap()
        // Should show either content or empty state
        let emptyState = app.staticTexts["No Sightings Yet"]
        let progressView = app.activityIndicators.firstMatch
        XCTAssertTrue(
            emptyState.waitForExistence(timeout: 8) || progressView.exists,
            "Community tab should show either empty state or loading"
        )
    }

    // MARK: - Map tab

    func test_mapTab_canBeNavigatedTo() {
        app.segmentedControls.firstMatch.waitForExistence(timeout: 5)
        app.segmentedControls.firstMatch.buttons["Map"].tap()
        // Should show a map or empty state
        let noNestsText = app.staticTexts["No Nests Reported"]
        let mapView = app.maps.firstMatch
        XCTAssertTrue(
            mapView.waitForExistence(timeout: 8) || noNestsText.exists,
            "Map tab should show map or empty state"
        )
    }
}

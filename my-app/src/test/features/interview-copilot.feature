Feature: Interview Copilot - AI-Powered Mock Interview Simulator
  As a job candidate
  I want to practice technical interviews with AI guidance
  So that I can improve my interview performance and confidence

  Background:
    Given the Interview Copilot system is running
    And interview drills are available in the database
    And the rubric scoring system is configured

  Scenario: Browse and select interview drills
    Given I am on the Interview Copilot dashboard
    When I view available interview drills
    Then I should see drills categorized by difficulty
    And I should see drills categorized by type
    And each drill should display title, difficulty, and time limit

  Scenario: Start a new interview session
    Given I have selected the "Property Search Implementation" drill
    When I click "Start Interview"
    Then a new interview session should be created
    And I should see the 3-panel simulation interface
    And the timer should start counting down from 45 minutes
    And the AI interviewer should greet me with the problem description

  Scenario: Interact with AI interviewer via chat
    Given I am in an active interview session
    When I type "Can you clarify the expected data volume?" in the chat
    And I press Enter
    Then the AI should respond with clarification
    And the chat transcript should be updated
    And both messages should have timestamps

  Scenario: Write and update code in the editor
    Given I am in an active interview session
    And the code editor contains starter code
    When I modify the code
    Then the code should be automatically saved
    And the line numbers should update accordingly
    And the code should maintain syntax highlighting

  Scenario: Run code and see test results
    Given I have written a solution in the code editor
    When I click the "Run" button
    Then my code should be executed
    And I should see console output in the output panel
    And test cases should be run against my code
    And I should see passed and failed test counts

  Scenario: Submit solution for evaluation
    Given I have completed my solution
    When I click "Submit Solution"
    Then the session should be marked as completed
    And the timer should stop
    And the AI should analyze my code and communication
    And I should receive rubric-based scores

  Scenario: View detailed session results
    Given I have submitted my solution
    When the evaluation is complete
    Then I should see my overall score percentage
    And I should see scores broken down by technical dimensions
    And I should see scores broken down by communication dimensions
    And I should see scores broken down by problem-solving dimensions

  Scenario: Receive AI-generated feedback
    Given I am viewing my session results
    Then I should see a feedback summary
    And I should see identified strengths
    And I should see areas for improvement
    And I should see specific code review comments
    And I should see communication review points
    And I should see recommended next steps

  Scenario: Track performance over time
    Given I have completed multiple interview sessions
    When I view my performance dashboard
    Then I should see my average score across all sessions
    And I should see my strongest skill areas
    And I should see my improvement areas
    And I should see my progress trend over time
    And I should see my recent session history

  Scenario: Handle time expiration
    Given I am in an active interview session
    When the timer reaches zero
    Then the session should be automatically submitted
    And I should be notified that time has expired
    And my partial solution should be evaluated

  Scenario: Reset code to starter template
    Given I have modified the code in the editor
    When I click the "Reset" button
    And I confirm the reset action
    Then the code should revert to the starter template
    And the output panel should be cleared
    And test results should be cleared

  Scenario: Filter drills by category
    Given I am browsing available drills
    When I filter by "backend" category
    Then I should only see backend-related drills
    And the drill count should update accordingly

  Scenario: View drill requirements before starting
    Given I am viewing a drill details
    Then I should see the drill description
    And I should see the list of requirements
    And I should see the expected test cases
    And I should see the rubric weights for scoring

  Scenario: Pause and resume session
    Given I am in an active interview session
    When an unexpected event requires me to pause
    Then I should be able to pause the session
    And the timer should stop
    And I should be able to resume when ready
    And the timer should continue from where it stopped

  Scenario: Export session transcript
    Given I have completed an interview session
    When I view the results
    Then I should be able to export the chat transcript
    And I should be able to export my final code
    And I should be able to export the feedback report

  Scenario: Practice mode without scoring
    Given I want to practice without pressure
    When I select "Practice Mode"
    Then I can work through drills without time limits
    And I can get hints from the AI without penalty
    And scoring is disabled until I choose to enable it
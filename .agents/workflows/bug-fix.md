# Bug Fix Workflow

1. Create a fix branch from `develop`: `git checkout -b fix/<name>`
2. Write a failing test reproducing the reported defect.
3. Implement the minimal targeted fix.
4. Verify the test now passes alongside all regression test suites.
5. Submit PR targeting `develop` and tag the relevant area lead.

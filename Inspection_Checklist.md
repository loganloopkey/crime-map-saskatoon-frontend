# Code Review/Inspection Checklist - for Group 12

## Individual Inspection Report - [Your Name]
**File Reviewed:** `[filename]` by [Teammate's Name]
**Review Date:** [Date]

---

## General & Readability

| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 1 | Does the code work? Does it perform its intended function, the logic is correct etc. | | |
| 2 | Is all the code easily understood? | | |
| 3 | Is there any redundant or duplicate code? | | |
| 4 | Is the code as modular as possible? | | |
| 5 | Can any global variables be replaced? | | |
| 6 | Is there any commented-out code? | | |
| 7 | Are function and variable names meaningful? (e.g., getUserById not fetchData) | | |
| 8 | **CUSTOM:** Is there any hardcoded data that should be in a config file or environment variable? (e.g., API URLs, secret keys) | | |
| 9 | **CUSTOM:** Is all console.log debugging code removed? | | |
| 10 | **CUSTOM:** For asynchronous operations (API calls): Are async/await or Promises used correctly? Is error handling implemented? | | |

---

### Performance & Structure

| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 1 | Can any logging or debugging code be removed? | | |
| 2 | Can any of the code be replaced with library or built-in functions? | | |
| 3 | **CUSTOM:** For backend API routes: Are database queries efficient? (e.g., using SELECT * vs. selecting specific columns) | | |
| 4 | **CUSTOM:** Can any complex logic be broken down into smaller, reusable helper functions? | | |
| 5 | **CUSTOM:** Is the project folder structure logical and consistent? | | |
| 6 | **CUSTOM:** Are map-related components (markers, layers, popups) separated into reusable modules? | | |

---

### Security

| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 1 | Are all data inputs checked (for the correct type, length, format, and range) and encoded? | | |
| 2 | Are output values checked and encoded? | | |
| 3 | Are invalid parameter values handled? | | |
| 4 | **CUSTOM:** Are environment variables (e.g., database passwords, API keys) properly hidden and not committed to git? | | |
| 5 | **CUSTOM:** Is sensitive user data (like passwords) being hashed before storage? | | |
| 6 | **CUSTOM:** Are API error messages generic avoiding leaks? | | |


---

### Documentation & Maintenance

| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 1 | Do comments exist and describe the intent of the code? | | |
| 2 | Are all functions commented? | | |
| 3 | Is there any incomplete code? If so, is it flagged with a // TODO: comment linked to a GitHub Issue? | | |
| 4 | Is the use and function of third-party libraries documented? | | |
| 5 | **CUSTOM:** For new environment setups, are the steps documented in the README.md? | | |
| 6 | **CUSTOM:** Does the README include well documented steps for using the program? | | |


---

### Testing

| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 1 | Is the code testable? The code should be structured so that it doesn't add too many or hide dependencies, is unable to initialize objects, test frameworks can use methods etc. | | |
| 2 | Do tests exist, and are they comprehensive? | | |
| 3 | Do unit tests actually test that the code is performing the intended functionality? | | |
| 4 | Could any test code be replaced with the use of an existing API? | | |
| 5 | **CUSTOM:** Does the test data represent real-world examples and edge cases? | | |
| 6 | **CUSTOM:** Are tests isolated and independent? | | |

---

### Code Implementation

#### **Variables & Constants**
| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 1.1 | Are descriptive identifier names used in accord with naming conventions | | |
| 1.2 | Are there variables with confusingly similar names? | | |
| 1.3 | Is every variable properly initialized? | | |
| 1.4 | Can any non-local variables be made local? | | |
| 1.5 | Are there literal constants that should be named constants? | | |
| 1.6 | **CUSTOM:** Are boolean variables named with prefixes like `is`, `has`, or `should`? (e.g., `isLoading`, `hasPermission`) | | |

#### **Methods & Functions**
| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 2.1 | Are descriptive method names used in accord with naming conventions? | | |
| 2.2 | Is every parameter value checked before being used? | | |
| 2.3 | Does every method return a correct value at every return point? | | |
| 2.4 | **CUSTOM:** Are function names consistent with the project's pattern? (e.g., all data-fetching functions prefixed with fetch or get) | | |
| 2.5 | **CUSTOM:** Do functions avoid causing side-effects unless necessary? | | |
| 2.6 | **CUSTOM:** Are API-layer functions separated from UI-layer functions? | | |

#### **Computations**
| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 3.1 | Is underflow or overflow possible in any computation? | | |
| 3.2 | Does any expression depend on order of evaluation of operators? Are parentheses used to avoid ambiguity? | | |
| 3.3 | **CUSTOM:** Are equality checks using the appropriate operator? (In JavaScript, is === (strict equality) used instead of == (type-coercing equality) unless specifically needed?) | | |
| 3.4 | **CUSTOM:** Are geographic calculations (distance, coordinates) accurate and tested? | | |

#### **Control Flow**
| # | Checklist Item | Response | Notes & Comments |
|---|----------------|----------|------------------|
| 4.1 | Will all loops terminate in all cases? | | |
| 4.2 | **CUSTOM:** Are conditional statements covering all expected cases? | | |
| 4.3 | **CUSTOM:** Is error handling implemented for asynchronous operations? (Are async/await blocks wrapped in try/catch?) | | |

---

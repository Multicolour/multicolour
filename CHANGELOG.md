# Change Log

## [0.6.14](https://github.com/Multicolour/multicolour/tree/0.6.14) (2017-10-10)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/0.4.2...0.6.14)

**Implemented enhancements:**

- Add ability to specify example value for Docs [\#293](https://github.com/Multicolour/multicolour/issues/293)
- Handle unhandledRejection [\#288](https://github.com/Multicolour/multicolour/issues/288)
- Support using environmentals in the init command [\#287](https://github.com/Multicolour/multicolour/issues/287)
- Default Accept to application/json [\#282](https://github.com/Multicolour/multicolour/issues/282)
- Don't error/exit when a waterline "fix" fails. [\#278](https://github.com/Multicolour/multicolour/issues/278)
- Make error message when trying to relate to unknown model better  [\#272](https://github.com/Multicolour/multicolour/issues/272)
- Add option to disable sequence fix on start [\#269](https://github.com/Multicolour/multicolour/issues/269)
- Add flag to init command to skip npm install [\#252](https://github.com/Multicolour/multicolour/issues/252)
- Make the JWT option in init clearer [\#243](https://github.com/Multicolour/multicolour/issues/243)
- Remove requirement to .scan [\#239](https://github.com/Multicolour/multicolour/issues/239)
- CLI :: Ask for database auth details and OAuth/JWT config during init [\#235](https://github.com/Multicolour/multicolour/issues/235)
- Don't assume production, instead assume development [\#230](https://github.com/Multicolour/multicolour/issues/230)
- Waterline doesn't automatically create the database [\#229](https://github.com/Multicolour/multicolour/issues/229)
- Improve error reporting in config during start up [\#226](https://github.com/Multicolour/multicolour/issues/226)
- Default user plugin :: password should be stored in database, not in plugin [\#224](https://github.com/Multicolour/multicolour/issues/224)
- CLI and the American Spelling of Color [\#207](https://github.com/Multicolour/multicolour/issues/207)
- Ask for default user config if auth selected in CLI init [\#204](https://github.com/Multicolour/multicolour/issues/204)
- DELETE should return the deleted entities. [\#187](https://github.com/Multicolour/multicolour/issues/187)
- Bad error message [\#175](https://github.com/Multicolour/multicolour/issues/175)
- Add newman for automatic integration testing [\#174](https://github.com/Multicolour/multicolour/issues/174)
- Improve init content [\#173](https://github.com/Multicolour/multicolour/issues/173)
- Better error messages when Waterline throws validation error. [\#169](https://github.com/Multicolour/multicolour/issues/169)
- Tidy up tests and update the readme [\#166](https://github.com/Multicolour/multicolour/issues/166)
- Support association query filters [\#165](https://github.com/Multicolour/multicolour/issues/165)
- Show error message when project name is invalid [\#160](https://github.com/Multicolour/multicolour/issues/160)
- Add default sorting to endpoints. [\#153](https://github.com/Multicolour/multicolour/issues/153)
- Add metadata to model definitions [\#129](https://github.com/Multicolour/multicolour/issues/129)
- Move waterline-joi schema creation to model generation [\#117](https://github.com/Multicolour/multicolour/issues/117)
- Replace sha1 password hashing in initialisation template [\#115](https://github.com/Multicolour/multicolour/issues/115)
- Make CLI extendable. [\#113](https://github.com/Multicolour/multicolour/issues/113)
- Improve and update documentation [\#111](https://github.com/Multicolour/multicolour/issues/111)
- Fix bad verbiage, it's an interrupt signal- not a kill signal [\#109](https://github.com/Multicolour/multicolour/issues/109)
- Don't include the core user model for no reason. [\#108](https://github.com/Multicolour/multicolour/issues/108)
- When doing write operations, should create related entities as well [\#97](https://github.com/Multicolour/multicolour/issues/97)
- Handle duplicate key database error. [\#95](https://github.com/Multicolour/multicolour/issues/95)
- Add `plugins` array to config to auto-load plugins without app.js [\#94](https://github.com/Multicolour/multicolour/issues/94)
- Remove annoying .get everything interface. [\#93](https://github.com/Multicolour/multicolour/issues/93)
- Improve constraints behaviour [\#60](https://github.com/Multicolour/multicolour/issues/60)
- Extend automatic relationship detection to foreign key configurations [\#44](https://github.com/Multicolour/multicolour/issues/44)
- Optimise PUT handler [\#37](https://github.com/Multicolour/multicolour/issues/37)
- Create basic theme for front-end. [\#16](https://github.com/Multicolour/multicolour/issues/16)
- Rename JWT auth provider to 'Email/Password \(JWT\)' [\#273](https://github.com/Multicolour/multicolour/pull/273) ([molovo](https://github.com/molovo))
- Feature/joi validator in schema [\#125](https://github.com/Multicolour/multicolour/pull/125) ([davemackintosh](https://github.com/davemackintosh))
- Add a method to the model to validate input using joi [\#124](https://github.com/Multicolour/multicolour/pull/124) ([davemackintosh](https://github.com/davemackintosh))
- Feature/package json startup [\#123](https://github.com/Multicolour/multicolour/pull/123) ([davemackintosh](https://github.com/davemackintosh))
- Feature/improved constraints [\#122](https://github.com/Multicolour/multicolour/pull/122) ([davemackintosh](https://github.com/davemackintosh))
- Replace SHA-1 password hashing with PBKDF2 [\#116](https://github.com/Multicolour/multicolour/pull/116) ([molovo](https://github.com/molovo))

**Fixed bugs:**

- id appears in writable schema [\#292](https://github.com/Multicolour/multicolour/issues/292)
- Error while creating database when project is hyphenated. [\#281](https://github.com/Multicolour/multicolour/issues/281)
- Error while creating database that already exists with MySQL adapter [\#280](https://github.com/Multicolour/multicolour/issues/280)
- createdAt / updatedAt hard coded to validate as strings [\#271](https://github.com/Multicolour/multicolour/issues/271)
- Endpoint rawify doesn't include all defined properties. [\#270](https://github.com/Multicolour/multicolour/issues/270)
- Init fails with heiphenated project names [\#264](https://github.com/Multicolour/multicolour/issues/264)
- If any service fails to start, it blocks cli and have to core dump exit. [\#240](https://github.com/Multicolour/multicolour/issues/240)
- postgres fixes need to escape table/column names [\#238](https://github.com/Multicolour/multicolour/issues/238)
- CLI :: Ask for database auth details and OAuth/JWT config during init [\#235](https://github.com/Multicolour/multicolour/issues/235)
- Error: Cannot find module 'waterline-sqlite3' [\#223](https://github.com/Multicolour/multicolour/issues/223)
- Selecting certain auth options in the init CLI always installs JWT [\#208](https://github.com/Multicolour/multicolour/issues/208)
- DELETE on non-existent document 500s [\#186](https://github.com/Multicolour/multicolour/issues/186)
- Update endpoints need to make all keys optional [\#185](https://github.com/Multicolour/multicolour/issues/185)
- SQLite 3 adapter needs prepublish running [\#176](https://github.com/Multicolour/multicolour/issues/176)
- JWT plugin added when no auth chosen in init command [\#172](https://github.com/Multicolour/multicolour/issues/172)
- Auth object always has password in it after init with no auth plugin chosen [\#171](https://github.com/Multicolour/multicolour/issues/171)
- Fix Content Header in Swagger. [\#170](https://github.com/Multicolour/multicolour/issues/170)
- Windows :: multicolour init fails `npm noent` spawn error [\#163](https://github.com/Multicolour/multicolour/issues/163)
- Twitter option broken [\#162](https://github.com/Multicolour/multicolour/issues/162)
- Writing package Json [\#161](https://github.com/Multicolour/multicolour/issues/161)
- Init fails if space in folder name [\#159](https://github.com/Multicolour/multicolour/issues/159)
- Fix PUT endpoint [\#156](https://github.com/Multicolour/multicolour/issues/156)
- Startup routine :: Promises swallow errors. [\#146](https://github.com/Multicolour/multicolour/issues/146)
- Nested entity creation only works for objects [\#145](https://github.com/Multicolour/multicolour/issues/145)
- npm ERR! notarget No compatible version found: multicolour-seed@^0.1.0 [\#130](https://github.com/Multicolour/multicolour/issues/130)
- Edge Case with default migrate policy [\#110](https://github.com/Multicolour/multicolour/issues/110)
- Get rid of migrate policy on multicolour\_user [\#101](https://github.com/Multicolour/multicolour/issues/101)
- multicolour\_user salt changes randomly? [\#99](https://github.com/Multicolour/multicolour/issues/99)
- Handle duplicate key database error. [\#95](https://github.com/Multicolour/multicolour/issues/95)
- Default env is development, should be production [\#82](https://github.com/Multicolour/multicolour/issues/82)
- Cannot read property identity of undefined. [\#81](https://github.com/Multicolour/multicolour/issues/81)
- Investigate failing tests but everything working.. [\#80](https://github.com/Multicolour/multicolour/issues/80)

**Closed issues:**

- Action required: Greenkeeper could not be activated 🚨 [\#267](https://github.com/Multicolour/multicolour/issues/267)
- Breaking change :: Switch start and stop routines to promises [\#148](https://github.com/Multicolour/multicolour/issues/148)
- add 'next' and 'back' buttons for use when viewing the Examples section [\#141](https://github.com/Multicolour/multicolour/issues/141)
- node environment requires setting to 'development' & app.js no longer generated [\#140](https://github.com/Multicolour/multicolour/issues/140)
- Create more advanced frontend generator - Poll! [\#57](https://github.com/Multicolour/multicolour/issues/57)

**Merged pull requests:**

- Update pluralize to the latest version 🚀 [\#286](https://github.com/Multicolour/multicolour/pull/286) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update debug to the latest version 🚀 [\#284](https://github.com/Multicolour/multicolour/pull/284) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Rollback async dependency due to conflict with waterline [\#274](https://github.com/Multicolour/multicolour/pull/274) ([molovo](https://github.com/molovo))
- Update dependencies to enable Greenkeeper 🌴 [\#268](https://github.com/Multicolour/multicolour/pull/268) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Feature/model metadata [\#132](https://github.com/Multicolour/multicolour/pull/132) ([davemackintosh](https://github.com/davemackintosh))
- Feature/write ops [\#128](https://github.com/Multicolour/multicolour/pull/128) ([davemackintosh](https://github.com/davemackintosh))
- Update tape to version 4.6.3 🚀 [\#121](https://github.com/Multicolour/multicolour/pull/121) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update joi to version 10.0.1 🚀 [\#120](https://github.com/Multicolour/multicolour/pull/120) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update uuid to version 3.0.0 🚀 [\#119](https://github.com/Multicolour/multicolour/pull/119) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update fs-extra to version 1.0.0 🚀 [\#112](https://github.com/Multicolour/multicolour/pull/112) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- replacestream@4.0.2 breaks build ⚠️ [\#83](https://github.com/Multicolour/multicolour/pull/83) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- eslint@3.3.0 breaks build ⚠️ [\#79](https://github.com/Multicolour/multicolour/pull/79) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [0.4.2](https://github.com/Multicolour/multicolour/tree/0.4.2) (2016-08-12)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/0.4.1...0.4.2)

**Implemented enhancements:**

- Plugins can extend core Plugin class [\#73](https://github.com/Multicolour/multicolour/issues/73)

**Closed issues:**

- Add better logging behind debug module [\#74](https://github.com/Multicolour/multicolour/issues/74)
- Uncaught error: reply\[multicolour.request\(...\)\] is not a function [\#72](https://github.com/Multicolour/multicolour/issues/72)
- Clean exit when running app.js without DB running [\#71](https://github.com/Multicolour/multicolour/issues/71)

**Merged pull requests:**

- Feature/74 debugging logging [\#78](https://github.com/Multicolour/multicolour/pull/78) ([davemackintosh](https://github.com/davemackintosh))
- 🐛 Fixes missing `multicolour.request\("decorator"\)` [\#77](https://github.com/Multicolour/multicolour/pull/77) ([davemackintosh](https://github.com/davemackintosh))
- Default register method negates the requirement for one in the plugin. [\#76](https://github.com/Multicolour/multicolour/pull/76) ([davemackintosh](https://github.com/davemackintosh))
- 🐛 Bug :: Process doesn't exit when DB errors. [\#75](https://github.com/Multicolour/multicolour/pull/75) ([davemackintosh](https://github.com/davemackintosh))

## [0.4.1](https://github.com/Multicolour/multicolour/tree/0.4.1) (2016-08-05)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/0.3.4...0.4.1)

**Implemented enhancements:**

- Add configuration validation [\#70](https://github.com/Multicolour/multicolour/issues/70)
- Multicolour user collection/table creation issues [\#69](https://github.com/Multicolour/multicolour/issues/69)
- ROBOTS.txt [\#55](https://github.com/Multicolour/multicolour/issues/55)
- Create an optional blueprint abstraction for granular route/FE control [\#53](https://github.com/Multicolour/multicolour/issues/53)
- Support path prefix [\#52](https://github.com/Multicolour/multicolour/issues/52)

**Fixed bugs:**

- Error with schema creation [\#48](https://github.com/Multicolour/multicolour/issues/48)

**Closed issues:**

- 0.3.2 Release [\#50](https://github.com/Multicolour/multicolour/issues/50)
- Integrate Sorrow [\#12](https://github.com/Multicolour/multicolour/issues/12)
- Create automated test suite based on Joi for REST api. [\#9](https://github.com/Multicolour/multicolour/issues/9)
- JWT integration. [\#6](https://github.com/Multicolour/multicolour/issues/6)

**Merged pull requests:**

- Feature/blueprint abstraction [\#68](https://github.com/Multicolour/multicolour/pull/68) ([davemackintosh](https://github.com/davemackintosh))
- Feature/flow based testing [\#67](https://github.com/Multicolour/multicolour/pull/67) ([davemackintosh](https://github.com/davemackintosh))
- Update eslint to version 3.0.1 🚀 [\#66](https://github.com/Multicolour/multicolour/pull/66) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update pluralize to version 3.0.0 🚀 [\#63](https://github.com/Multicolour/multicolour/pull/63) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- snyk@1.15.0 breaks build 🚨 [\#62](https://github.com/Multicolour/multicolour/pull/62) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update all dependencies 🌴 [\#61](https://github.com/Multicolour/multicolour/pull/61) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [0.3.4](https://github.com/Multicolour/multicolour/tree/0.3.4) (2016-03-10)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/v0.2.9...0.3.4)

**Implemented enhancements:**

- Programatically add relationships to `multicolour\_user` [\#51](https://github.com/Multicolour/multicolour/issues/51)
- 2 Blueprints but 3 resources is confusing [\#46](https://github.com/Multicolour/multicolour/issues/46)
- Replace hapi-swaggered-ui [\#45](https://github.com/Multicolour/multicolour/issues/45)

**Fixed bugs:**

- `.stop\(\)` doesn't run the teardown routine on the db [\#49](https://github.com/Multicolour/multicolour/issues/49)
- 'undefined' not recognised. Not good, setting to .any\(\) [\#47](https://github.com/Multicolour/multicolour/issues/47)
- User parameters string is very long in Swagger [\#41](https://github.com/Multicolour/multicolour/issues/41)

## [v0.2.9](https://github.com/Multicolour/multicolour/tree/v0.2.9) (2016-02-08)
**Implemented enhancements:**

- Add nedb adapter for database [\#38](https://github.com/Multicolour/multicolour/issues/38)
- Better constraints. [\#34](https://github.com/Multicolour/multicolour/issues/34)
- Data layer should be in Multicolour core [\#33](https://github.com/Multicolour/multicolour/issues/33)
- Missing role support for users [\#32](https://github.com/Multicolour/multicolour/issues/32)
- Remove any default migration policy. [\#28](https://github.com/Multicolour/multicolour/issues/28)
- Disable overly protective migrate default from "safe" to "alter" [\#25](https://github.com/Multicolour/multicolour/issues/25)
- Make plugins less archaic [\#24](https://github.com/Multicolour/multicolour/issues/24)
- Add query parameter support to GET requests. [\#22](https://github.com/Multicolour/multicolour/issues/22)

**Fixed bugs:**

- Default migration policy appears to be "alter" [\#43](https://github.com/Multicolour/multicolour/issues/43)
- Missed multicolour-auth-oauth module in CLI [\#39](https://github.com/Multicolour/multicolour/issues/39)
- CLI bashing config and not respecting path [\#36](https://github.com/Multicolour/multicolour/issues/36)
- Data layer should be in Multicolour core [\#33](https://github.com/Multicolour/multicolour/issues/33)
- REST API GET handling by id \(non-existent objects\) [\#31](https://github.com/Multicolour/multicolour/issues/31)
- CLI outdated [\#30](https://github.com/Multicolour/multicolour/issues/30)
- 500 on POST /user caused by incorrectly handled waterline validation error. [\#29](https://github.com/Multicolour/multicolour/issues/29)
- Remove any default migration policy. [\#28](https://github.com/Multicolour/multicolour/issues/28)
- Don't default the migration policy to "alter" [\#27](https://github.com/Multicolour/multicolour/issues/27)
- Throwing error in multicolour start and not db start prevents error reporting [\#26](https://github.com/Multicolour/multicolour/issues/26)
- Disable overly protective migrate default from "safe" to "alter" [\#25](https://github.com/Multicolour/multicolour/issues/25)
- Make plugins less archaic [\#24](https://github.com/Multicolour/multicolour/issues/24)
- Fix PUT and PATCH [\#23](https://github.com/Multicolour/multicolour/issues/23)
- Identity in blueprints not respected [\#21](https://github.com/Multicolour/multicolour/issues/21)

**Closed issues:**

- Can't seed app generated with CLI [\#42](https://github.com/Multicolour/multicolour/issues/42)
- Mongodb kerberos peer dependency [\#40](https://github.com/Multicolour/multicolour/issues/40)
- Create Example app [\#35](https://github.com/Multicolour/multicolour/issues/35)
- Add upload storage provider plugin support [\#19](https://github.com/Multicolour/multicolour/issues/19)
- API docs/WIKI [\#18](https://github.com/Multicolour/multicolour/issues/18)
- Blueprint -\> Frontend route/collection/model generation. [\#17](https://github.com/Multicolour/multicolour/issues/17)
- Custom, additional route creation in blueprints. [\#15](https://github.com/Multicolour/multicolour/issues/15)
- Create CLI [\#14](https://github.com/Multicolour/multicolour/issues/14)
- Make it all JSON API compliant [\#13](https://github.com/Multicolour/multicolour/issues/13)
- Paginate GET requests [\#10](https://github.com/Multicolour/multicolour/issues/10)
- Create Waterline to Joi converter [\#8](https://github.com/Multicolour/multicolour/issues/8)
- Integrate Swagger for automatic REST docs. [\#7](https://github.com/Multicolour/multicolour/issues/7)
- `Bell` integration for multiple OAuth authorisation types on REST api. [\#5](https://github.com/Multicolour/multicolour/issues/5)
- Rainbow blueprint -\> Hapi CRUD route generation. [\#4](https://github.com/Multicolour/multicolour/issues/4)
- Rainbow blueprint -\> Waterline Collection. [\#3](https://github.com/Multicolour/multicolour/issues/3)
- Version 1.0 [\#1](https://github.com/Multicolour/multicolour/issues/1)

**Merged pull requests:**

- Add a Gitter chat badge to README.md [\#20](https://github.com/Multicolour/multicolour/pull/20) ([gitter-badger](https://github.com/gitter-badger))
- Dev [\#2](https://github.com/Multicolour/multicolour/pull/2) ([davemackintosh](https://github.com/davemackintosh))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*
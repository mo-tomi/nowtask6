@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd android-app
call gradlew.bat clean assembleDebug

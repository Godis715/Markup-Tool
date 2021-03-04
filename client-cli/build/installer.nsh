!macro customInstall
  DetailPrint "Register markup-tool URI Handler"
  DeleteRegKey HKCR "markup-tool"
  WriteRegStr HKCR "markup-tool" "" "URL:markup-tool"
  WriteRegStr HKCR "markup-tool" "URL Protocol" ""
  WriteRegStr HKCR "markup-tool\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "markup-tool\shell" "" ""
  WriteRegStr HKCR "markup-tool\shell\Open" "" ""
  WriteRegStr HKCR "markup-tool\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend

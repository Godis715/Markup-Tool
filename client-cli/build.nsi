Unicode True
!define NAME "markup-tool"
Name "${NAME}"
Outfile "${NAME}-setup.exe"
InstallDir "$ProgramFiles\${NAME}"

Section "Installer Section"
SetOutPath $INSTDIR
File "dist\index.js"
File "scripts\run.cmd"
SectionEnd

Section "Registering protocol"
DetailPrint "Register markup-tool URI Handler"
DeleteRegKey HKCR "${NAME}"
WriteRegStr HKCR "${NAME}" "" "URL:${NAME}"
WriteRegStr HKCR "${NAME}" "URL Protocol" ""
WriteRegStr HKCR "${NAME}\shell" "" ""
WriteRegStr HKCR "${NAME}\shell\Open" "" ""
WriteRegStr HKCR "${NAME}\shell\Open\command" "" '$INSTDIR\run "%1"'
SectionEnd

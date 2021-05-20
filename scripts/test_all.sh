#!/bin/bash

for dir in ./*;
do
  [[ -d $dir ]] || continue
  cd $dir
  [[ -f scripts/run_unit_tests.sh ]] && bash scripts/run_unit_tests.sh
  [[ -f package.json ]] && npm run test
  cd ..
done

read -p "Press enter to continue"

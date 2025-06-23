#!/bin/bash

tool_root_dir="./scripts"

project_root_dir=".."
# Directory where you want to store the mapping data (relative path from project_root_dir).
map_file_dir="$project_root_dir/id-map-data"


cd $tool_root_dir

files=$(find $project_root_dir/ui)
target_file_pattern="^.+\.((t|j)sx|svg)$"
for file in $files; do
  if [ -d $file ]; then
    # If $file directory, do nothing.
    continue
  fi

  if [[ $file =~ $target_file_pattern ]]; then
    # If $file is TSX, JSX, or SVG file, do ID embedding.
    node ./id-embedding/main.js --file $file --projectRootDir $project_root_dir --mapFileDir $map_file_dir &
  fi
done

wait
echo "Finish ID-embedding."

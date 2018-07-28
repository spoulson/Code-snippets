#!/bin/sh
# Resize directory of images to a fixed width with aspect.
# Randomize filenames.
# Useful for processing a set of images for website and concealing original names.

# For Mac OSX, install ImageMagick: brew install imagemagick

WIDTH=960

mkdir -p resized

for filename in *.jpg; do
    NEWNAME=$(cat /dev/urandom | env LC_CTYPE=C tr -dc 'a-zA-Z0-9' | head -c 8)
    convert "$filename" -resize ${WIDTH}x -write resized/"${NEWNAME}"_${WIDTH}x.jpg
done

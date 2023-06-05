import glob from "glob";
import fs from "fs-extra";

const options = {
  ignore: "**/node_modules/**",
  nodir: true,
};

glob("./**/*.{d.ts,js,js.map}", options, (err, files) => {
  if (err) {
    console.log(err);
    return;
  }

  files.forEach((file) => {
    fs.remove(file, (err) => {
      if (err) console.error(`Failed to remove ${file}:`, err);
      else console.log(`Successfully removed ${file}`);
    });
  });
});

//-------displaying current date-------//
const fs = require("fs");

exports.displayCurrentDate = async (res, page) => {
  try {
    const date = await new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let updatedPage = fs.readFileSync(page, "utf-8").replace(/{@date@}/g, date);
    res.send(updatedPage);
  } catch (err) {
    console.log(err);
  }
};
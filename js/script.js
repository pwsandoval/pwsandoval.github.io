const toggle_button = document.querySelector("#toggle-dark");
const root = document.querySelector(":root");
let is_dark = false;

toggle_button.addEventListener("click", () => {
  console.log(is_dark);
  is_dark = !is_dark;

  root.style.setProperty(
    "--mainTextColor",
    is_dark ? "var(--mainTextColor-light)" : "var(--mainTextColor-dark)"
  );

  root.style.setProperty(
    "--secondaryTextColor",
    is_dark
      ? "var(--secondaryTextColor-light)"
      : "var(--secondaryTextColor-dark)"
  );

  root.style.setProperty(
    "--mainLinkColor",
    is_dark ? "var(--mainLinkColor-light)" : "var(--mainLinkColor-dark)"
  );

  root.style.setProperty(
    "--mainBorderColor",
    is_dark ? "var(--mainBorderColor-light)" : "var(--mainBorderColor-dark)"
  );

  root.style.setProperty(
    "--mainBgColor",
    is_dark ? "var(--mainBgColor-light)" : "var(--mainBgColor-dark)"
  );
});

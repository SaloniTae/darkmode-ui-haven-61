
export const passwordList = [
  "oor@forever",
  "oor@aurora",
  "oor@legacy",
  "oor@popcorn",
  "oor@elite",
  "oor@bliss",
  "oor@essence",
  "oor@timeless",
  "oor@flix",
  "oor@verse",
  "oor@storm",
  "oor@unstoppable",
  "oor@eternal",
  "oor@beyond",
  "oor@awakened",
  "oor@evenmore",
  "oor@true",
  "oor@drift",
  "oor@pulse",
  "oor@vibe",
  "oor@echo",
  "oor@dawn",
  "oor@orbit",
  "oor@hype",
  "oor@realm",
  "oor@space",
  "oor@nova"
];

export const getRandomPassword = (): string => {
  const randomIndex = Math.floor(Math.random() * passwordList.length);
  return passwordList[randomIndex];
};

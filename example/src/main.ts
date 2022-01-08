import kijs, { use } from "kijs";
import Tween from "../../src";

use(Tween);

kijs("button").click(() => {
  kijs("#app").animate(
    {
      opacity: "toggle",
    },
    "slow",
    "swing"
  );
});

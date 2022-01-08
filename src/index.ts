import Tween, { installer, Options } from "./core/Tween";
import isHiddenWithinTree from "./helpers/isHiddenWithinTree";
import showHide from "./helpers/showHide";
import easings from "./static/easings";
import speeds from "./static/speeds";
import steps from "./static/steps";

export { isHiddenWithinTree, showHide, Tween, easings, speeds, steps };
export type { Options };

export default installer;

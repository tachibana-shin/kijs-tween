export default function speed (speed, easing, fn) {
   var opt =
     speed && typeof speed === "object"
       ? jQuery.extend({}, speed)
       : {
           complete: fn || (!fn && easing) || (isFunction(speed) && speed),
           duration: speed,
           easing: (fn && easing) || (easing && !isFunction(easing) && easing),
         };
 
   // Go to the end state if fx are off
   if (Tween.off) {
     opt.duration = 0;
   } else {
     if (typeof opt.duration !== "number") {
       if (opt.duration in Tween.speeds) {
         opt.duration = Tween.speeds[opt.duration];
       } else {
         opt.duration = Tween.speeds._default;
       }
     }
   }
 
   // Normalize opt.queue - true/undefined/null -> "fx"
   if (opt.queue == null || opt.queue === true) {
     opt.queue = "fx";
   }
 
   // Queueing
   opt.old = opt.complete;
 
   opt.complete = function () {
     if (isFunction(opt.old)) {
       opt.old.call(this);
     }
 
     if (opt.queue) {
       jQuery.dequeue(this, opt.queue);
     }
   };
 
   return opt;
 };
const dataPriv = new WeakMap < any,
  new Map<string, string[]>> ()

function queue(elem, type, data) {
  var queue;

  if (elem) {
    type = (type || "fx") + "queue";
    
    if (dataPriv.has(elem) === false) {
      dataPriv.set(elem, new Map())
    }
    queue = dataPriv.get(elem)!.get(type);

    // Speed up dequeue by getting out quickly if this is just a lookup
    if (data) {
      if (!queue || Array.isArray(data)) {
        dataPriv.get(elem)!.set(type, queue = Array.from(data))
        
      } else {
        queue.push(data);
      }
    }
    return queue || [];
  }
}

function dequeue(elem, type) {
  type = type || "fx";

  var queue = queue(elem, type),
    startLength = queue.length,
    fn = queue.shift(),
    hooks = _queueHooks(elem, type),
    next = function() {
      dequeue(elem, type);
    };

  // If the fx queue is dequeued, always remove the progress sentinel
  if (fn === "inprogress") {
    fn = queue.shift();
    startLength--;
  }

  if (fn) {

    // Add a progress sentinel to prevent the fx queue from being
    // automatically dequeued
    if (type === "fx") {
      queue.unshift("inprogress");
    }

    // Clear up the last queue stop function
    delete hooks.stop;
    fn.call(elem, next, hooks);
  }

  if (!startLength && hooks) {
    hooks.empty.fire();
  }
}
// Not public - generate a queueHooks object, or return the current one
function _queueHooks(elem, type) {
  var key = type + "queueHooks";
  return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
    empty: jQuery.Callbacks("once memory").add(function() {
      dataPriv.remove(elem, [type + "queue", key]);
    })
  });
}


jQuery.fn.extend({
  queue: function(type, data) {
    var setter = 2;

    if (typeof type !== "string") {
      data = type;
      type = "fx";
      setter--;
    }

    if (arguments.length < setter) {
      return jQuery.queue(this[0], type);
    }

    return data === undefined ?
      this :
      this.each(function() {
        var queue = jQuery.queue(this, type, data);

        // Ensure a hooks for this queue
        _queueHooks(this, type);

        if (type === "fx" && queue[0] !== "inprogress") {
          dequeue(this, type);
        }
      });
  },
  dequeue: function(type) {
    return this.each(function() {
      jQuery.dequeue(this, type);
    });
  },
  clearQueue: function(type) {
    return this.queue(type || "fx", []);
  },
})
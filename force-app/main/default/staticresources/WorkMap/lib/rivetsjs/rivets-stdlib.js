/* global
  rivets
*/

/* eslint
  no-unused-vars: "warn",
  no-empty: "off",
  no-prototype-builtins: "off"
*/

(function() {

	//* General

	rivets.formatters.args = function(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return fn.apply(this, Array.prototype.concat.call(arguments, args));
		}
	};

  //* Comparisons

	rivets.formatters['=='] = function(value, arg) {
		return value == arg;
	};

  //* String formatters

  rivets.formatters.prepend = function(value, prepend) {
		if (value || typeof value === 'string' || value === 0) {
			return '' + prepend + value;
		}
		return '';
	};

  rivets.formatters.capitalize = function(value) {
		value = rivets.formatters.toString(value);
		return value.split(' ').map(function(seq) {
			return seq.split('-').map(function(word) {
				return word.charAt(0).toUpperCase() + word.slice(1);
			}).join('-');
		}).join(' ');
	};

  //* Array formatters

	rivets.formatters.length = function(value) {
		if (rivets.formatters.isString(value)) {
			return value.length
		}
		return rivets.formatters.toArray(value).length;
	};

  rivets.formatters.every = function(arr, value, field) {
		if (arr instanceof Array) {
			if (field) {
				return arr.every(e => e[field] === value);
			}
			return arr.every(e => e === value);
		}
		return false;
	};

  rivets.formatters.none = function(arr, value, field) {
		return !rivets.formatters.every(arr, value, field);
	};

  //* Object formatters

  rivets.formatters.keys = function(obj) {
		if (obj && typeof obj === 'object') {
			return Object.keys(obj);
		}
		return [];
	};

  //* Type checking

  rivets.formatters.isArray = function(value) {
		return typeof Array.isArray == 'function' ? Array.isArray(value) : value instanceof Array;
	};

  rivets.formatters.isString = function(value) {
		return typeof value == 'string' || value instanceof String;
	};

  //* Type conversion

  rivets.formatters.toArray = function(value) {
		if (rivets.formatters.isArray(value)) {
			return value;
		} else if (rivets.formatters.isObject(value)) {
			return rivets.formatters.values(value);
		}
		return [value];
	};

  rivets.formatters.toString = function(value) {
		return value ? value.toString() : '';
	};

	//* Bindings

	rivets.binders['style-*'] = function(el, value) {
		el.style.setProperty(this.args[0], value);
	};

	rivets.binders.keyupdelay = {
		callback: null,
		publishes: true,
		priority: 2000,
		preValue: '',
		timer: null,
		value: '',

		bind: function(el) {
			var self = this;
			this.event = 'keyup';
			self.callback = function() {
				self.publish();
				clearTimeout(self.binder.timer);
				self.binder.timer = setTimeout(function() {
					self.binder.value = el.value.trim();
					if (self.binder.preValue.length !== self.binder.value.length || self.binder.preValue !== self.binder.value) {
						self.binder.callback();
						self.binder.preValue = self.binder.value;
					}
				}, 500);
			};
			el.addEventListener('keyup', this.callback, false);
		},

		unbind: function(el) {
			el.removeEventListener('keyup', this.callback, false);
		},

		routine: function() {
			rivets.binders.value.routine.apply(this, arguments);
		}

	};

}(window.rivets = window.rivets || {}));
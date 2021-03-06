goog.provide('ngeo.popoverDirective');
goog.provide('ngeo.popoverAnchorDirective');
goog.provide('ngeo.popoverContentDirective');
goog.provide('ngeo.PopoverController');

goog.require('ngeo');

/**
 * Provides a directive used to display a Bootstrap popover.
 *
 *<div ngeo-popover>
 *  <a ngeo-popover-anchor class="btn btn-info">anchor 1</a>
 *  <div ngeo-popover-content>
 *    <ul>
 *      <li>action 1:
 *        <input type="range"/>
 *      </li>
 *    </ul>
 *  </div>
 *</div>
 * @ngdoc directive
 * @ngInject
 * @ngname ngeoPopover
 * @return {angular.Directive} The Directive Definition Object.
 */
ngeo.popoverDirective = function() {
  return {
    restrict: 'A',
    scope: true,
    controller: 'NgeoPopoverController',
    controllerAs : 'popoverCtrl',
    link: function(scope, elem, attrs, ngeoPopoverCtrl) {
      ngeoPopoverCtrl.anchorElm.on('hidden.bs.popover', function() {
        /**
         * @type {{inState : Object}}
         */
        var popover = ngeoPopoverCtrl.anchorElm.data('bs.popover');
        popover['inState'].click = false;
      });

      ngeoPopoverCtrl.anchorElm.on('inserted.bs.popover', function() {
        ngeoPopoverCtrl.bodyElm.show();
        ngeoPopoverCtrl.shown = true;
      });

      ngeoPopoverCtrl.anchorElm.popover({
        container: 'body',
        html: true,
        content: ngeoPopoverCtrl.bodyElm,
        placement : attrs['ngeoPopoverPlacement'] || 'right'
      });

      if (attrs['ngeoPopoverDismiss']) {
        $(attrs['ngeoPopoverDismiss']).on('scroll', function() {
          ngeoPopoverCtrl.dismissPopover();
        });
      }

      scope.$on('$destroy', function() {
        ngeoPopoverCtrl.anchorElm.popover('destroy');
        ngeoPopoverCtrl.anchorElm.unbind('inserted.bs.popover');
        ngeoPopoverCtrl.anchorElm.unbind('hidden.bs.popover');
      });
    }
  };
};

/**
 * @ngdoc directive
 * @ngInject
 * @ngname ngeoPopoverAnchor
 * @return {angular.Directive} The Directive Definition Object
 */
ngeo.popoverAnchorDirective = function() {
  return {
    restrict: 'A',
    require: '^^ngeoPopover',
    link: function(scope, elem, attrs, ngeoPopoverCtrl) {
      ngeoPopoverCtrl.anchorElm = elem;
    }
  };
};

/**
 * @ngdoc directive
 * @ngInject
 * @ngname ngeoPopoverContent
 * @return {angular.Directive} The Directive Definition Object
 */
ngeo.popoverContentDirective = function() {
  return {
    restrict: 'A',
    require: '^^ngeoPopover',
    link : function(scope, elem, attrs, ngeoPopoverCtrl) {
      ngeoPopoverCtrl.bodyElm = elem;
      elem.hide();
    }
  };
};

/**
 * The controller for the 'popover' directive.
 * @constructor
 * @ngInject
 * @export
 * @ngdoc controller
 * @ngname NgeoPopoverController
 * @param {angular.Scope} $scope Scope.
 */
ngeo.PopoverController = function($scope) {
  /**
   * The state of the popover (displayed or not)
   * @type {boolean}
   * @export
   */
  this.shown = false;

  /**
   * @type {angular.JQLite|undefined}
   * @export
   */
  this.anchorElm = undefined;

  /**
   * @type {angular.JQLite|undefined}
   * @export
   */
  this.bodyElm = undefined;

  function onMouseDown(clickEvent) {
    if (this.anchorElm[0] !== clickEvent.target &&
      this.bodyElm.parent()[0] !== clickEvent.target &
      this.bodyElm.parent().find(clickEvent.target).length === 0 && this.shown) {
      this.dismissPopover();
    }
  }

  angular.element('body').on('mousedown', onMouseDown.bind(this));

  $scope.$on('$destroy', function() {
    angular.element('body').off('mousedown', onMouseDown);
  });
};


/**
 * Dissmiss popover function
 * @export
 */
ngeo.PopoverController.prototype.dismissPopover = function() {
  this.shown = false;
  this.anchorElm.popover('hide');
};

ngeo.module.controller('NgeoPopoverController', ngeo.PopoverController);
ngeo.module.directive('ngeoPopover', ngeo.popoverDirective);
ngeo.module.directive('ngeoPopoverAnchor', ngeo.popoverAnchorDirective);
ngeo.module.directive('ngeoPopoverContent', ngeo.popoverContentDirective);

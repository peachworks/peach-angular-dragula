'use strict';

var dragula = require('dragula');

/*jshint unused: false*/
function register (angular) {
  return ['dragulaService', function angularDragula (dragulaService) {
    return {
      restrict: 'A',
      scope: {
        dragulaScope: '=',
        dragulaModel: '=',
        dragulaController: '='
      },
      link: link
    };

    function link (scope, elem, attrs) {
      var dragulaScope = scope.dragulaScope || scope.$parent;
      var container = elem[0];
      var name = scope.$eval(attrs.dragula);
      var drake, pageY;
      var pageFrame = document.getElementById('page_frame');
      var moves = function(el, source, handle, sibling) {
        if(angular.element(el).hasClass('is-ungrouped')) {
          return false;
        } else {
          return true;
        }
      };
      var accepts = function(el, target, source, sibling) {
        if(angular.element(target).hasClass('has-location') && angular.element(el).hasClass('dragula-root') ||
          angular.element(target).hasClass('has-location') && angular.element(el).hasClass('dragula-branch') ||
          angular.element(target).hasClass('dragula-root-container') && angular.element(el).hasClass('dragula-leaf') ||
          angular.element(target).hasClass('has-child') && angular.element(el).hasClass('dragula-leaf') ||
          angular.element(target).hasClass('is-ungrouped') && angular.element(el).hasClass('dragula-root') ||
          angular.element(target).hasClass('is-ungrouped') && angular.element(el).hasClass('dragula-branch')) {
          return false;
        } else {
          return true;
        }
      };
      var groups = [];
      var locations = [];

      var bag = dragulaService.find(dragulaScope, name);
      if (bag) {
        drake = bag.drake;
        drake.containers.push(container);
      } else {
        drake = dragula({
          containers: [container],
          moves: moves,
          accepts: accepts,
          revertOnSpill: true
        });
        dragulaService.add(dragulaScope, name, drake);
      }

      //force page to scroll down and up when dragging an element
      angular.element(document).on('mousemove', function(event) {
        if(drake.dragging) {
          var pageFrameTop = pageFrame.offsetTop;
          var pageFrameBottom = pageFrame.offsetTop + pageFrame.offsetHeight;

          if (pageFrameBottom - event.pageY < 120) {
            pageFrame.scrollTop += 5;
          } else if(pageFrameTop + event.pageY < 120) {
            pageFrame.scrollTop -= 1;
          }
        }
      });

      scope.$watch('dragulaModel', function (newValue, oldValue) {
        if (!newValue) {
          return;
        }

        if (drake.models) {
          var modelIndex = oldValue ? drake.models.indexOf(oldValue) : -1;
          if (modelIndex >= 0) {
            drake.models.splice(modelIndex, 1, newValue);
          } else {
            drake.models.push(newValue);
          }
        } else {
          drake.models = [newValue];
        }

        dragulaService.handleModels(dragulaScope, drake);
      });

      scope.$watch('dragulaController', function (newValue, oldValue) {
        if (!newValue) {
          return;
        }

        drake.on('drop', function (dropElm, target, source) {
          var dropElmId, dropElmType;
          var positionMap = {};
          var parent;

          if(angular.element(dropElm).attr('id')) {
            dropElmId = angular.element(dropElm).attr('id');
          }

          if(angular.element(dropElm).hasClass('dragula-leaf')) {
            dropElmType = 'location';
          } else {
            dropElmType = 'group';
          }

          if(dropElmId) {
            var group, location, i;

            if(dropElmType === 'group') {
              for (i = 0; i < scope.dragulaController.orgGroupsService.groups.length; i++) {
                if (scope.dragulaController.orgGroupsService.groups[i].id === parseInt(dropElmId)) {
                  group = scope.dragulaController.orgGroupsService.groups[i];
                }
              }
            }

            if(dropElmType === 'location') {
              for (i = 0; i < scope.dragulaController.orgGroupsService.locations.length; i++) {
                if (scope.dragulaController.orgGroupsService.locations[i].id === parseInt(dropElmId)) {
                  location = scope.dragulaController.orgGroupsService.locations[i];
                }
              }
            }

            var children = angular.element(target).children();
            for (i = 0; i < children.length; i++) {
              if (children[i].id) {
                positionMap[i] = children[i].id;
              }
            }

            if(group) {
              if(angular.element(target).hasClass('dragula-root-container')) {
                group.parent_id = null;

                for (i = 0; i < angular.element(target).children().length; i++) {
                  if(angular.element(angular.element(target).children()[i]).hasClass('dragula-branch')) {
                    angular.element(angular.element(target).children()[i]).remove();
                  }
                }

                scope.dragulaController.updateGroups(group, positionMap);
              }

              if(angular.element(target).hasClass('dragula-branch-container')) {
                parent = angular.element(target).parent().parent();
                if(parent.attr('id')) {
                  group.parent_id = parseInt(parent.attr('id'));
                }

                scope.dragulaController.updateGroups(group, positionMap);
              }
            }

            if(location) {
              if(angular.element(target).hasClass('dragula-branch-container')) {
                parent = angular.element(target).parent().parent();

                if(parent.attr('id')) {
                  location.org_group_id = parseInt(parent.attr('id'));
                } else {
                  //add to Ungrouped
                  location.org_group_id = null;
                }

                scope.dragulaController.updateLocation(location);
              }
            }
          }
        });
      });
    }
  }];
}

module.exports = register;

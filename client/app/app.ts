'use strict';
const angular = require('angular');
// import ngAnimate from 'angular-animate';
const ngCookies = require('angular-cookies');
const ngResource = require('angular-resource');
const ngSanitize = require('angular-sanitize');
require('ng-embed');
require('angular-file-upload');
require('ng-file-upload');
require('peerjs');
require('angular-media-preview');

import 'angular-socket-io';


const uiRouter = require('angular-ui-router');
const uiBootstrap = require('angular-ui-bootstrap');



import {routeConfig} from './app.config';

import _Auth from '../components/auth/auth.module';
import account from './account';
import admin from './admin';
import navbar from '../components/navbar/navbar.component';
import footer from '../components/footer/footer.component';
import main from './main/main.component';
import constants from './app.constants';
import util from '../components/util/util.module';
import socket from '../components/socket/socket.service';
import room from './room';




import './app.scss';

angular.module('projectTestApp', [
  ngCookies,
  ngResource,
  ngSanitize,
  'ngEmbed',
  'angularFileUpload',
  'ngFileUpload',

  'btford.socket-io',

  uiRouter,
  uiBootstrap,

  _Auth,
  account,
  admin,
  navbar,
  footer,
  main,
  constants,
  socket,
  util,
  room
])
  .config(routeConfig)
  .run(function($rootScope, $location, Auth) {
    'ngInject';
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function(event, next) {
      Auth.isLoggedIn(function(loggedIn) {
        if(next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  });

angular
  .element(document)
  .ready(() => {
    angular.bootstrap(document, ['projectTestApp'], {
      strictDi: true
    });
  });

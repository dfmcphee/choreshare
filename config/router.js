/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


var router = new geddy.RegExpRouter();

router.get('/').to('Main.index');

// Auth Routes
router.get('/login').to('Main.login');
router.get('/logout').to('Main.logout');
router.post('/auth/local').to('Auth.local');
router.get('/auth/twitter').to('Auth.twitter');
router.get('/auth/twitter/callback').to('Auth.twitterCallback');
router.get('/auth/facebook').to('Auth.facebook');
router.get('/auth/facebook/callback').to('Auth.facebookCallback');
router.get('/auth/yammer').to('Auth.yammer');
router.get('/auth/yammer/callback').to('Auth.yammerCallback');

// Group Routes
router.resource('groups');
router.get('/invite').to('Groups.invite');
router.get('/accept-invite').to('Groups.accept');

// User Routes
router.match('/users/:id/edit(.:format)','GET').to({controller: 'Users', action: 'edit'});
router.match('/users(.:format)','POST').to({controller: 'Users', action: 'create'});
router.match('/users/add(.:format)','GET').to({controller: 'Users', action: 'add'});
router.match('/users/:id(.:format)','PUT').to({controller: 'Users', action: 'update'});
router.match('/users/:id(.:format)','DELETE').to({controller: 'Users', action: 'destroy'});

// Task Routes
router.match('/tasks(.:format)','POST').to({controller: 'Tasks', action: 'create'});
router.match('/tasks/:id(.:format)','PUT').to({controller: 'Tasks', action: 'update'});
router.match('/tasks/:id/assign(.:format)','PUT').to({controller: 'Tasks', action: 'assign'});
router.match('/tasks/:id/set-date(.:format)','PUT').to({controller: 'Tasks', action: 'setDate'});
router.match('/tasks/check-interval(.:format)','GET').to({controller: 'Tasks', action: 'checkInterval'});
router.match('/tasks/:id(.:format)','DELETE').to({controller: 'Tasks', action: 'destroy'});

exports.router = router;

const jsonServer = require('json-server');
const server = jsonServer.create();
const _ = require('lodash');
const router = jsonServer.router('./db.json');
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 3002;

server.use(middlewares);
server.use(jsonServer.bodyParser);

const db = router.db;
// db.setState({tasks : [], users : []});

server.post('/api/tasks', (req, res) => {

  try {
    const body = req.body;
    const returnData = db.get('tasks').push(body).write();
    console.log('The returned data is : ', returnData);

    const responseData = {
      task_name : body.postTask.task_name,
      task_description : body.postTask.task_description,
      reminder_interval : body.postTask.reminder_interval,
      due_date : body.postTask.due_date,
      set_date : body.postTask.set_date,
      status : body.postTask.status
    }

    console.log('response data is: ', responseData);

    res.status(200).send(responseData);
  } catch(error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
});

server.put('/api/tasks', (req, res) => {
  const body = req.body;

  try {
    const dataQuery = db.get('tasks')
    .find(i => i.postTask.set_date === body.set_date)
    .get('postTask');
    
    const newValue = {...(dataQuery.value()), ...body};
    console.log('The new value data is:', newValue);

    db.get('tasks')
    .find(i => i.postTask.set_date === body.set_date)
    .get('postTask').assign(newValue).write();

    console.log('the data query is: ', dataQuery.value());
    res.status(200).json(dataQuery);
  } catch(error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
});

server.delete('/api/tasks', (req, res) => {
  const body = req.body;

  try {
    const dataQuery = db.get('tasks')
    .remove(i => i.postTask.set_date === body.set_date).write();

    console.log('the data query is: ', dataQuery);
    
    res.status(200).send('Task deleted successfully');
  } catch (error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
});

server.get('/api/users', (req, res) => {
  const body = req.body;

  try {
    const userData = db.get('users')
    .find(i => i.user_details.email === body.email).value()

    if(userData === undefined) throw Error('No user exists for this email');

    const responseData = {
      token : userData.token,
      user_details : {
        user_name : userData.user_details.user_name,
        email : userData.user_details.email
      }
    }

    res.status(200).json(responseData);
  } catch(error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
});

server.post('/api/users', (req, res) => {
  const body = req.body;

  try {
    const returnData = db.get('users').push(body).write();
    console.log('The returned data is : ', returnData);

    const responseData = {
      tasks : [],
      token : body.token,
      user_details : {
        user_name : body.user_details.user_name,
        email : body.user_details.email
      }
    }

    res.status(200).json(responseData);
  } catch(error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
});

server.put('/api/users', (req, res) => {
  const body = req.body;

  try {
    const queryData = db.get('users')
    .find(i => i.user_details.email === body.email)
    .get('user_details');

    const newValue = {...(queryData.value()), ...body};
    console.log('The new value data is:', newValue);

    db.get('users')
    .find(i => i.user_details.email === body.email)
    .get('user_details').assign(newValue).write();

    const responseData = {
      user_name : newValue.user_name,
      email : newValue.email
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
});

server.delete('/api/users', (req, res) => {
  const body = req.body;

  try {
    const dataQuery = db.get('users')
    .remove(i => i.user_details.email === body.email).write();

    console.log('the data query is: ', dataQuery);

    res.status(200).send('Task deleted successfully');
  } catch (error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
})

server.use(router);
server.listen(port, () => {
  console.log('now listening on port: ', port);
});

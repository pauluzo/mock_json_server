const jsonServer = require('json-server');
const server = jsonServer.create();
const _ = require('lodash');
const { createToken, verifyToken } = require('./auth');
const { generatePassword, validatePassword } = require('./passwordValidation');
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

server.put('/api/tasks', verifyToken, (req, res) => {
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

server.delete('/api/tasks', verifyToken, (req, res) => {
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

server.get('/api/users', verifyToken, (req, res) => {
  const email = req.query.email;

  try {
    const userData = db.get('users')
    .find(i => i.user_details.email === email).value()

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
  const body = req.body.user_details;
  const {hash, salt} = generatePassword(body.password);
  const userData = {...body, password : hash, salt}
  console.log('the formulated user data is: ', userData);

  try {
    const returnData = db.get('users').push(userData).write();
    console.log('The returned data is : ', returnData);

    const auth_token = createToken(userData.user_name, req.body.token);
    console.log('the generated JWT token is: ', auth_token);

    const responseData = {
      tasks : [],
      auth_token,
      user_details : {
        user_name : body.user_name,
        email : body.email
      }
    }

    res.status(200).json(responseData);
  } catch(error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
});

server.post('/api/users/login', (req, res) => {
  const {email, password} = req.body;

  try {
    const userData = db.get('users')
    .find(i => i.email === email).value();

    if(!userData) return res.json({error : "User not found. Did you want to register instead?"});
    console.log('Returned user data is : ', userData);
    const isUser = validatePassword(password, userData.password, userData.salt);
    if(isUser) {
      const userToken = createToken(userData.user_name, userData.email);

      return res.status(200).json({
        auth_token : userToken,
        user_details : {
          user_name : userData.user_name,
          email : userData.email,
          imageUrl : userData.imageUrl
        }
      });
    } else {
      console.log('the email exists, but password failed');
      return res.status(400).json({
        error : "Invalid credentials. Please check credentials and try again" 
      });
    }
  } catch (error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured: ' + error});
  }
})

server.put('/api/users', verifyToken, (req, res) => {
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

server.delete('/api/users', verifyToken, (req, res) => {
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

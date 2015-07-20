using System;
using System.Collections.Generic;
using System.Threading;
using System.Web.Http;

public class PersonController : ApiController
{
    static readonly PersonRepository Repository = new PersonRepository();
    int _maxDelayMs = 0;
    static Random _rnd = new Random(Environment.TickCount);

    // GET api/<controller>
    public Person GetEmpty()
    {
        return new Person();
    }

    // GET api/<controller>
    public IEnumerable<Person> Get()
    {
        if (_maxDelayMs > 0) Thread.Sleep(_rnd.Next(0, _maxDelayMs));
        return Repository.Get();
    }

    // GET api/<controller>/5
    public Person Get(int id)
    {
        if (_maxDelayMs > 0) Thread.Sleep(_rnd.Next(0, _maxDelayMs));
        return Repository.Get(id);
    }

    // POST api/<controller>
    public int Post([FromBody] Person value)
    {
        if (_maxDelayMs > 0) Thread.Sleep(_rnd.Next(0, _maxDelayMs));
        return Repository.InsertOrUpdate(value);
    }

    // DELETE api/<controller>/5
    public void Delete(int id)
    {
        if (_maxDelayMs > 0) Thread.Sleep(_rnd.Next(0, _maxDelayMs));
        Repository.Delete(id);
    }
}
using System.Collections.Generic;
using System.Web.Http;

public class PersonController : ApiController
{
    private static readonly PersonRepository Repository = new PersonRepository();
    // GET api/<controller>
    public IEnumerable<Person> Get()
    {
        return Repository.Get();
    }

    // GET api/<controller>/5
    public Person Get(int id)
    {
        return Repository.Get(id);
    }

    // POST api/<controller>
    public void Post([FromBody] Person value)
    {
        Repository.InsertOrUpdate(value);
    }

    // DELETE api/<controller>/5
    public void Delete(int id)
    {
        Repository.Delete(id);
    }
}
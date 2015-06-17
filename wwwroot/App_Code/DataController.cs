using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

public class DataController : ApiController
{
    private static readonly PersonRepository _personRepository = new PersonRepository();

    // GET api/<controller>
    public IEnumerable<Person> Get()
    {
        Thread.Sleep(2000);
        return _personRepository.Get();
    }

    // GET api/<controller>/5
    public Person Get(int id)
    {
        return _personRepository.Get(id);
    }

    // POST api/<controller>
    public void Post([FromBody] Person value)
    {
        _personRepository.Update(value);
    }

    // DELETE api/<controller>/5
    public void Delete(int id)
    {
        _personRepository.Delete(id);
    }
}
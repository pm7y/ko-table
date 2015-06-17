using System;
using System.Collections.Generic;
using System.Linq.Expressions;

public interface IRepository<T> : IDisposable where T : class
{
    IEnumerable<T> Get();
    IEnumerable<T> Get(Expression<Func<T, bool>> predicate);
    Person Get(int id);
    void Insert(T entry);
    void Update(T entry);
    void Delete(int id);
    void Save();
}
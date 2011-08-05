/*
Copyright (c) 2008 Gustavo G. Duarte (http://duartes.org/gustavo)
http://static.duartes.org/files/FuncExtensions.cs

This file is licensed under the terms of the MIT/X11 open source license. 
See copying.txt in the root directory of this project (above /src) or 
http://en.wikipedia.org/wiki/MIT_License for the terms of copyright.

ExecuteWithTimeout<T> used to execute a delegate with a timeout restriction.

*/

using System;
using System.Threading;

public static class FuncExtensions {
   public static T ExecuteWithTimeout<T>(this Func<T> delegateToRun, TimeSpan timeout) {
      FuncReturnWrapper<T> w = new FuncReturnWrapper<T>(delegateToRun);
      Thread t = new Thread(w.Run);

      t.Start();
      bool terminated = t.Join(timeout);
      if (!terminated) {
         t.Abort();
         throw new TimeoutException(string.Format("Timeout of {0} for running delegate {1} has expired", timeout, delegateToRun));
      }

      if (w.HasException) {
         // SHOULD: somehow preserve the original (real) StackTrace. If we throw a generic Exception using
         // w.Exception as the inner, we'd lose the expression type.
         // The current solution is also bad because it's obscure since the caller won't look in the Data. But
         // it's better than nothing.
         w.Exception.Data["originalStackTrace"] = w.Exception.StackTrace;

         throw w.Exception;
      }

      return w.Return;
   }

   public class FuncReturnWrapper<T> {
      public FuncReturnWrapper(Func<T> func) {
         this.m_func = func;
      }

      public void Run() {
         try {
            this.m_return = this.m_func();
         }
         catch (Exception ex) {
            this.Exception = ex;
         }
      }

      private T m_return;
      private readonly Func<T> m_func;

      public T Return {
         get { return this.m_return; }
      }

      public bool HasException {
         get { return this.Exception != null; }
      }

      public Exception Exception { get; private set; }
   }

}
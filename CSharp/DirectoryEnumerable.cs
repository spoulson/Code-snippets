// Code snippet originally from:
// http://www.eggheadcafe.com/software/aspnet/34259448/enumerating-a-directory.aspx

using System;
using System.Collections;
using System.Collections.Generic;
using System.Security.Permissions;
using System.Runtime.InteropServices;
using System.Runtime.ConstrainedExecution;
using Microsoft.Win32.SafeHandles;
using System.ComponentModel;

namespace SecondRateCompare {
   [Flags]
   public enum DirectoryEnumerableMode {
      Directory = 1,
      File = 2
   }

   public struct DirectoryEnumerator : IEnumerator<string> {
      private SafeFindHandle hFindFile;
      private string current;
      private string pattern;
      private DirectoryEnumerableMode mode;

      internal DirectoryEnumerator(string pattern, DirectoryEnumerableMode mode) {
         this.pattern = pattern;
         this.current = null;
         this.hFindFile = null;
         this.mode = mode;
      }

      public string Current {
         get { return current; }
      }

      public void Dispose() {
         if (null != hFindFile) {
            hFindFile.Close();
         }
      }

      object IEnumerator.Current {
         get { return this.Current; }
      }

      public bool MoveNext() {
         if (null == hFindFile) {
            return FindFirst();
         }
         else {
            return FindNext();
         }
      }

      public void Reset() {
         if (null != hFindFile) {
            hFindFile.Close();
            hFindFile = null;
         }
      }

      private bool FindFirst() {
         var fd = new Win32Native.WIN32_FIND_DATA();

         hFindFile = Win32Native.FindFirstFile(pattern, fd);

         if (hFindFile.IsInvalid) {
            int code = Marshal.GetLastWin32Error();

            if (code != Win32Native.ERROR_FILE_NOT_FOUND) {
               throw new Win32Exception(code);
            }
            else {
               return false;
            }
         }

         if (!AttributesMatchMode(fd.dwFileAttributes)) {
            return FindNext();
         }

         current = fd.cFileName;
         return true;
      }

      private bool FindNext() {
         var fd = new Win32Native.WIN32_FIND_DATA();

         while (Win32Native.FindNextFile(hFindFile, fd)) {
            if (!AttributesMatchMode(fd.dwFileAttributes)) {
               continue;
            }

            current = fd.cFileName;
            return true;
         }

         int code = Marshal.GetLastWin32Error();

         if (code != Win32Native.ERROR_NO_MORE_FILES) {
            throw new Win32Exception(code);
         }
         else {
            return false;
         }
      }

      private bool AttributesMatchMode(int fileAttributes) {
         bool isDir = (fileAttributes & Win32Native.FILE_ATTRIBUTE_DIRECTORY) == Win32Native.FILE_ATTRIBUTE_DIRECTORY;

         return (isDir && (mode & DirectoryEnumerableMode.Directory) == DirectoryEnumerableMode.Directory) ||
            (!isDir && (mode & DirectoryEnumerableMode.File) == DirectoryEnumerableMode.File);
      }

   }

   /// <summary>
   /// Enumerate through file names in a directory matching a filespec pattern using Win32 API
   /// </summary>
   /// <remarks>
   /// This approach is much more efficient than the System.IO.Directory.GetFiles() method on directories with
   /// a large number of files.  The Win32 API allows stepping through the files in a directory one by one without
   /// the overhead of loading all FileInfo structures for each matched file in the directory.
   /// </remarks>
   public class DirectoryEnumerable : IEnumerable<string> {
      private string pattern;
      private DirectoryEnumerableMode mode;

      /// <summary>
      /// Enumerate files and directories matching a filespec pattern.  Wildcards (*/?) are allowed.
      /// </summary>
      /// <param name="pattern">Filespec pattern</param>
      public DirectoryEnumerable(string pattern)
         : this(pattern, DirectoryEnumerableMode.Directory | DirectoryEnumerableMode.File) {
      }

      /// <summary>
      /// Enumerate files and/or directories matching a filespec pattern.  Wildcards (*/?) are allowed.
      /// </summary>
      /// <param name="pattern">Filespec pattern</param>
      /// <param name="mode">Flags match file and/or directories</param>
      public DirectoryEnumerable(string pattern, DirectoryEnumerableMode mode) {
         this.pattern = pattern;
         this.mode = mode;
      }

      IEnumerator<string> IEnumerable<string>.GetEnumerator() {
         return new DirectoryEnumerator(pattern, mode);
      }

      IEnumerator IEnumerable.GetEnumerator() {
         return ((IEnumerable<string>)this).GetEnumerator();
      }

   }

   internal sealed class SafeFindHandle : SafeHandleZeroOrMinusOneIsInvalid {
      [SecurityPermission(SecurityAction.LinkDemand, UnmanagedCode = true)]
      internal SafeFindHandle()
         : base(true) {
      }

      protected override bool ReleaseHandle() {
         // Close the search handle.
         return Win32Native.FindClose(base.handle);
      }
   }

   internal static class Win32Native {
      [Serializable, StructLayout(LayoutKind.Sequential, CharSet =
      CharSet.Auto), BestFitMapping(false)]
      internal class WIN32_FIND_DATA {
         internal int dwFileAttributes;
         internal int ftCreationTime_dwLowDateTime;
         internal int ftCreationTime_dwHighDateTime;
         internal int ftLastAccessTime_dwLowDateTime;
         internal int ftLastAccessTime_dwHighDateTime;
         internal int ftLastWriteTime_dwLowDateTime;
         internal int ftLastWriteTime_dwHighDateTime;
         internal int nFileSizeHigh;
         internal int nFileSizeLow;
         internal int dwReserved0;
         internal int dwReserved1;
         [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
         internal string cFileName;
         [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 14)]
         internal string cAlternateFileName;
      }

      [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
      internal static extern SafeFindHandle FindFirstFile(string fileName, [In, Out] WIN32_FIND_DATA data);

      [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
      internal static extern bool FindNextFile(SafeFindHandle hndFindFile, [In, Out, MarshalAs(UnmanagedType.LPStruct)] WIN32_FIND_DATA lpFindFileData);

      [ReliabilityContract(Consistency.WillNotCorruptState, Cer.Success), DllImport("kernel32.dll")]
      internal static extern bool FindClose(IntPtr handle);

      internal const int ERROR_NO_MORE_FILES = 18;
      internal const int ERROR_FILE_NOT_FOUND = 2;
      internal const int FILE_ATTRIBUTE_DIRECTORY = 0x00000010;
   }
   
}